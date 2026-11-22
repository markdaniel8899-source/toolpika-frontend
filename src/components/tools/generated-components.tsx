"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { WorkspaceSkeleton } from "@/components/ui/skeleton";

const loading = () => <WorkspaceSkeleton />;

export const generatedComponents: Record<string, ComponentType> = {
};
