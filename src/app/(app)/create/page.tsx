import type { Metadata } from "next";
import { CreateMemoryWizard } from "@/features/create/create-memory-wizard";

export const metadata: Metadata = { title: "New Memory" };

export default function CreateMemoryPage() {
  return <CreateMemoryWizard />;
}
