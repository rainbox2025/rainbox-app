import { Sender } from "@/context/gmailContext";

export const filterAvailableSenders = (
  apiSenders: Sender[],
  onboardedEmails: Set<string>,
  localEmails?: Set<string>
): Sender[] => {
  return apiSenders.filter(apiSender => {
    // Condition 1: Sender must not be globally onboarded.
    const isNotOnboarded = !onboardedEmails.has(apiSender.email);
    // Condition 2: If localEmails are provided (for pagination), sender must not be in that list.
    const isNotInLocalList = localEmails ? !localEmails.has(apiSender.email) : true;

    return isNotOnboarded && isNotInLocalList;
  });
};