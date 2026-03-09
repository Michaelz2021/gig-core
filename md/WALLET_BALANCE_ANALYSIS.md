# Wallet Balance 분석: `balance` vs `available_balance`

## 현재 상황

### DB 스키마
```sql
CREATE TABLE wallets (
    balance DECIMAL(12,2) DEFAULT 0.00,              -- 총 잔액
    escrow_balance DECIMAL(12,2) DEFAULT 0.00,      -- 에스크로 보류 금액
    available_balance DECIMAL(12,2) GENERATED ALWAYS AS (balance - escrow_balance) STORED  -- 사용 가능 잔액 (자동 계산)
);
```

### 차이점

1. **`balance` (총 잔액)**
   - 지갑에 있는 전체 금액
   - 입금(deposit) 시 증가
   - 출금(withdrawal) 시 감소
   - 에스크로에 보류된 금액도 포함

2. **`escrow_balance` (에스크로 잔액)**
   - 예약/거래 중 보류된 금액
   - 실제로 사용할 수 없는 금액
   - 거래 완료 시 `balance`로 이동

3. **`available_balance` (사용 가능 잔액)**
   - **GENERATED COLUMN**: 자동 계산되는 컬럼
   - 공식: `available_balance = balance - escrow_balance`
   - 실제로 사용 가능한 금액
   - **읽기 전용**: 직접 업데이트 불가

## 현재 문제점

### 1. Entity에 `availableBalance`가 없음
```typescript
// wallet.entity.ts
@Entity('wallets')
export class Wallet {
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance: number; // ✅ 있음
  
  @Column({ name: 'escrow_balance', type: 'decimal', precision: 12, scale: 2, default: 0 })
  escrowBalance: number; // ✅ 있음
  
  // ❌ availableBalance가 없음!
}
```

### 2. API 응답에 `availableBalance`가 없음
```typescript
// payments.service.ts
async getWallet(userId: string) {
  const wallet = await this.getOrCreateWallet(userId);
  return { balance: Number(wallet.balance || 0) }; // ❌ availableBalance 없음
}
```

### 3. 앱에서 `available_balance`를 기대
- 앱이 `available_balance`를 사용하여 잔액을 표시
- API가 `balance`만 반환하여 잔액이 0으로 표시되는 문제 발생

## `available_balance` 제거 및 `balance` 통합 시 문제점

### ✅ 문제 없음 (권장)

**이유:**
1. `available_balance`는 **GENERATED COLUMN**이므로 실제 데이터가 아님
2. `balance`와 `escrow_balance`만 관리하면 됨
3. 필요시 `balance - escrow_balance`를 계산하여 반환

**통합 방법:**
```typescript
// Entity에 availableBalance 추가 (읽기 전용)
@Column({ 
  name: 'available_balance', 
  type: 'decimal', 
  precision: 12, 
  scale: 2,
  select: false, // TypeORM이 자동으로 계산하도록
  readonly: true 
})
availableBalance?: number; // 옵셔널로 선언

// 또는 서비스에서 계산
async getWallet(userId: string) {
  const wallet = await this.getOrCreateWallet(userId);
  const balance = Number(wallet.balance || 0);
  const escrowBalance = Number(wallet.escrowBalance || 0);
  const availableBalance = balance - escrowBalance;
  
  return { 
    balance,
    escrowBalance,
    availableBalance // 계산된 값 반환
  };
}
```

### ⚠️ 주의사항

1. **앱 호환성**
   - 앱이 `available_balance`를 사용 중이면 API 응답에 포함 필요
   - `available_balance`를 제거하면 앱 수정 필요

2. **DB 스키마 변경**
   - `available_balance` GENERATED COLUMN 제거 시:
     ```sql
     ALTER TABLE wallets DROP COLUMN available_balance;
     ```
   - 제거 후에도 `balance - escrow_balance`를 계산하여 사용 가능

3. **기존 코드 영향**
   - `admin.service.ts`에서 `available_balance`를 사용 중
   - 모든 곳에서 `balance - escrow_balance`로 계산하도록 수정 필요

## 권장 해결 방안

### 옵션 1: Entity에 `availableBalance` 추가 (읽기 전용)
```typescript
@Column({ 
  name: 'available_balance', 
  type: 'decimal', 
  precision: 12, 
  scale: 2,
  select: true, // DB에서 자동 계산된 값 읽기
  insert: false, // INSERT 시 제외
  update: false, // UPDATE 시 제외
})
availableBalance: number;
```

### 옵션 2: 서비스에서 계산하여 반환
```typescript
async getWallet(userId: string) {
  const wallet = await this.getOrCreateWallet(userId);
  const balance = Number(wallet.balance || 0);
  const escrowBalance = Number(wallet.escrowBalance || 0);
  
  return { 
    balance,
    escrowBalance,
    availableBalance: balance - escrowBalance // 계산하여 반환
  };
}
```

### 옵션 3: DB에서 `available_balance` 제거하고 코드에서 계산
```sql
-- DB 스키마 변경
ALTER TABLE wallets DROP COLUMN available_balance;
```

```typescript
// 모든 곳에서 balance - escrow_balance 계산
const availableBalance = balance - escrowBalance;
```

## 결론

**`available_balance`를 제거하고 `balance`로 통합해도 문제 없습니다.**

다만:
1. 앱이 `available_balance`를 사용 중이면 API 응답에 포함 필요
2. 모든 코드에서 `balance - escrow_balance`를 계산하도록 수정
3. DB GENERATED COLUMN 제거 시 마이그레이션 필요

**가장 간단한 해결책:**
- Entity에 `availableBalance` 추가 (읽기 전용)
- API 응답에 `availableBalance` 포함
- DB GENERATED COLUMN은 그대로 유지 (자동 계산)

