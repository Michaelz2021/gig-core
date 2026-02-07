import { PartialType } from '@nestjs/swagger';
import { CreateProviderAdDto } from './create-provider-ad.dto';

/**
 * 광고 수정 DTO. 모든 필드 선택(optional).
 * providerId 는 수정 시에도 전달 가능 (광고 소유 provider 변경 시).
 */
export class UpdateProviderAdDto extends PartialType(CreateProviderAdDto) {}
