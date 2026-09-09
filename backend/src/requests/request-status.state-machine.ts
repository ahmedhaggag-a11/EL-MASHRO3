import { BadRequestException } from '@nestjs/common';
import { RequestStatus } from '@prisma/client';

// The request lifecycle lives HERE, once, on the backend.
// The frontend renders whatever `status` it's given and offers only
// the actions the current status allows, but it never decides
// whether a transition is legal — this table does.
const ALLOWED_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  DRAFT: ['PUBLISHED', 'CANCELLED'],
  PUBLISHED: ['MATCHING', 'CANCELLED'],
  MATCHING: ['TUTOR_SELECTED', 'CANCELLED'],
  TUTOR_SELECTED: ['PAYMENT_PENDING', 'MATCHING', 'CANCELLED'],
  PAYMENT_PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
  COMPLETED: ['STUDENT_RATED', 'DISPUTED'],
  STUDENT_RATED: [],
  CANCELLED: [],
  DISPUTED: ['CONFIRMED', 'CANCELLED'], // resolved back to CONFIRMED, or cancelled with refund
};

export function assertValidTransition(from: RequestStatus, to: RequestStatus) {
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `Cannot transition request from ${from} to ${to}`,
    );
  }
}
