import type { ComponentType, SVGProps } from "react";
import {
  Activity,
  ArrowDownUp,
  ArrowRight,
  Braces,
  Calculator,
  CaseLower,
  CaseUpper,
  ChevronRight,
  Code,
  Copy,
  Database,
  Diff,
  FileText,
  Fingerprint,
  Gauge,
  Hash,
  Image,
  KeyRound,
  LayoutGrid,
  Link,
  Link2,
  Maximize2,
  Percent,
  Regex,
  Ruler,
  Shield,
  ShieldCheck,
  Sun,
  Moon,
  Globe,
  Menu,
  X,
  Search,
  Plus,
  Type,
  User,
  Wand2,
} from "lucide-react";

const ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  FileText,
  Image,
  Code,
  LayoutGrid,
  Shield,
  Link,
  Copy,
  Type,
  ShieldCheck,
  Activity,
  ArrowRight,
  CaseLower,
  CaseUpper,
  User,
  Wand2,
  ChevronRight,
  Sun,
  Moon,
  Globe,
  Menu,
  X,
  Search,
  Plus,
  ArrowDownUp,
  Braces,
  Calculator,
  Database,
  Diff,
  Fingerprint,
  Gauge,
  Hash,
  KeyRound,
  Link2,
  Maximize2,
  Percent,
  Regex,
  Ruler,
};

/**
 * Render a lucide icon by its registered name string (registry stores
 * `icon: "FileText"` rather than importing the component directly).
 * Falls back to a generic activity icon when the name is unknown.
 */
export function ToolIcon({
  name,
  className,
  ...props
}: {
  name: string;
  className?: string;
} & SVGProps<SVGSVGElement>) {
  const Icon = ICONS[name] ?? Activity;
  return <Icon className={className} {...props} />;
}
