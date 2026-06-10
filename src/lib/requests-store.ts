import { useSyncExternalStore } from "react";

export type RequestStatus = "In review" | "Matched" | "Quoted" | "Approved" | "Rejected";

export type CustomRequest = {
  id: string;
  customer: string;
  brief: string;
  budget: string;
  status: RequestStatus;
};

let items: CustomRequest[] = [
  { id: "R-104", customer: "Iris Laurent", brief: "Hand-painted gold serpent on black snapback", budget: "$220", status: "In review" },
  { id: "R-103", customer: "Theo Bardot", brief: "Embroidered family crest, ivory wool fitted", budget: "$340", status: "Matched" },
  { id: "R-102", customer: "Marc Devereux", brief: "Limited 50-piece tour merch, all black", budget: "$1,800", status: "Quoted" },
];

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const requestsStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getAll() {
    return items;
  },
  approve(id: string) {
    items = items.map((r) => (r.id === id ? { ...r, status: "Approved" as RequestStatus } : r));
    emit();
  },
  reject(id: string) {
    items = items.map((r) => (r.id === id ? { ...r, status: "Rejected" as RequestStatus } : r));
    emit();
  },
  remove(id: string) {
    items = items.filter((r) => r.id !== id);
    emit();
  },
};

export function useRequests() {
  return useSyncExternalStore(requestsStore.subscribe, () => items, () => items);
}
