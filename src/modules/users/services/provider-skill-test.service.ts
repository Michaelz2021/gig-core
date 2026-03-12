import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Provider } from '../entities/provider.entity';
import { ProviderSkillTestResult } from '../entities/provider-skill-test-result.entity';
import { SkillTestSubmitDto } from '../dto/skill-test-submit.dto';

/**
 * Score mapping per design:
 * - Score ≥ 80% → full points (100)
 * - Score 60–79% → partial (50)
 * - Score < 60% → 0 pts (retake allowed after 30 days)
 */
function categoryScoreToPoints(scorePct: number): number {
  if (scorePct >= 80) return 100;
  if (scorePct >= 60) return 50;
  return 0;
}

@Injectable()
export class ProviderSkillTestService {
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @InjectRepository(ProviderSkillTestResult)
    private readonly skillTestResultRepository: Repository<ProviderSkillTestResult>,
  ) {}

  /**
   * Submit skill test result for the authenticated provider.
   * Upserts provider_skill_test_results and recomputes providers.ai_skill_test_score_pct.
   */
  async submitSkillTest(userId: string, dto: SkillTestSubmitDto) {
    const provider = await this.providerRepository.findOne({ where: { userId } });
    if (!provider) {
      throw new ForbiddenException('Provider profile not found. Only providers can submit skill tests.');
    }

    const answers = (dto.answers ?? []).map((a) => ({
      question_index: Number(a.question_index),
      selected_option_index: Number(a.selected_option_index),
    }));

    const payload = {
      providerId: provider.id,
      category: dto.category.trim(),
      answers,
      timeTakenSeconds: Number(dto.time_taken_seconds) ?? 0,
      score: Number(dto.score) ?? 0,
      passed: Boolean(dto.passed),
      correctCount: Number(dto.correct_count) ?? 0,
      totalQuestions: Number(dto.total_questions) ?? 0,
    };

    await this.skillTestResultRepository.upsert(payload, {
      conflictPaths: ['providerId', 'category'],
      skipUpdateIfNoValuesChanged: false,
    });

    const recorded = await this.skillTestResultRepository.findOne({
      where: { providerId: provider.id, category: payload.category },
    });
    const recordedAt = recorded?.updatedAt ?? recorded?.createdAt ?? new Date();

    await this.recomputeProviderSkillScorePct(provider.id);

    return {
      result_id: uuidv4(),
      passed: payload.passed,
      score: payload.score,
      correct_count: payload.correctCount,
      total_questions: payload.totalQuestions,
      recorded_at: recordedAt.toISOString(),
    };
  }

  /**
   * Recompute providers.ai_skill_test_score_pct from all category results.
   * Per category: ≥80% → 100 pts, 60–79% → 50 pts, <60% → 0 pts. Then average.
   */
  async recomputeProviderSkillScorePct(providerId: string): Promise<number | null> {
    const results = await this.skillTestResultRepository.find({
      where: { providerId },
      select: ['score'],
    });
    if (results.length === 0) {
      await this.providerRepository.update(providerId, { aiSkillTestScorePct: null });
      return null;
    }
    const points = results.map((r) => categoryScoreToPoints(r.score));
    const average = points.reduce((a, b) => a + b, 0) / points.length;
    const rounded = Math.round(average * 100) / 100;
    await this.providerRepository.update(providerId, { aiSkillTestScorePct: rounded });
    return rounded;
  }
}
