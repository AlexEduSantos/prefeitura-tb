import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const sortByDateDesc = <T extends { createdAt: string }>(
  items: T[],
  dateField: keyof T = "createdAt",
): T[] => {
  return [...items].sort((a, b) => {
    const dateA = new Date(a[dateField] as string).getTime();
    const dateB = new Date(b[dateField] as string).getTime();
    return dateB - dateA;
  });
};

export const getMediaUrl = (media: string) =>
  `${process.env.NEXT_PUBLIC_API_URL}/media/file/${media}`;
