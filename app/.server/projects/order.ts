import { generateKeyBetween } from "fractional-indexing";

/**
 * Order key for a project placed between two neighbours, for drag and drop.
 * Pass `null` for a missing neighbour at the start or end of the list.
 */
export function orderBetween(
  before: string | null,
  after: string | null,
): string {
  return generateKeyBetween(before, after);
}
