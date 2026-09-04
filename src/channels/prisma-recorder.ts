import type { PrismaClient } from "@prisma/client";
import type { DeliveryAttemptRecorder } from "./dispatcher.ts";

// The real implementation of the dispatcher's persistence seam, against the
// delivery_attempts table. Not exercised by dispatcher.test.ts, which uses
// an in-memory fake on purpose (no database in that unit's tests).
export function createPrismaDeliveryAttemptRecorder(
  prisma: PrismaClient,
): DeliveryAttemptRecorder {
  return {
    async create({ ruleMatchId, channelConfigId, attemptNumber }) {
      const attempt = await prisma.deliveryAttempt.create({
        data: {
          ruleMatchId,
          channelConfigId,
          attemptNumber,
          status: "pending",
        },
      });
      return attempt.id;
    },
    async update(attemptId, patch) {
      if (patch.status === "sent") {
        await prisma.deliveryAttempt.update({
          where: { id: attemptId },
          data: { status: "sent", providerRef: patch.providerRef ?? null },
        });
      } else {
        await prisma.deliveryAttempt.update({
          where: { id: attemptId },
          data: {
            status: "failed",
            error: patch.error,
            retryable: patch.retryable,
          },
        });
      }
    },
  };
}
