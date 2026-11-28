/**
 * Pure octal and symbolic chmod conversion. No shell is invoked and nothing
 * outside the three permission sets is read or written.
 */

export type PermissionClass = "owner" | "group" | "public";
export type PermissionKind = "read" | "write" | "execute";

export interface PermissionSet {
  read: boolean;
  write: boolean;
  execute: boolean;
}

export interface ChmodState {
  owner: PermissionSet;
  group: PermissionSet;
  public: PermissionSet;
}

export const PERMISSION_CLASSES: PermissionClass[] = ["owner", "group", "public"];
export const PERMISSION_KINDS: PermissionKind[] = ["read", "write", "execute"];

export const DEFAULT_CHMOD_STATE: ChmodState = {
  owner: { read: true, write: true, execute: true },
  group: { read: true, write: false, execute: true },
  public: { read: true, write: false, execute: true },
};

export const SAMPLE_CHMOD_STATE: ChmodState = {
  owner: { read: true, write: true, execute: false },
  group: { read: true, write: false, execute: false },
  public: { read: true, write: false, execute: false },
};

export function permissionDigit(set: PermissionSet): number {
  return (set.read ? 4 : 0) + (set.write ? 2 : 0) + (set.execute ? 1 : 0);
}

export function permissionChars(set: PermissionSet): string {
  return `${set.read ? "r" : "-"}${set.write ? "w" : "-"}${set.execute ? "x" : "-"}`;
}

/** Four digit display form, for example 0755. */
export function numericMode(state: ChmodState): string {
  return `0${permissionDigit(state.owner)}${permissionDigit(state.group)}${permissionDigit(state.public)}`;
}

export function symbolicMode(state: ChmodState): string {
  return `${permissionChars(state.owner)}${permissionChars(state.group)}${permissionChars(state.public)}`;
}

export function chmodCommand(state: ChmodState, fileName = "file"): string {
  return `chmod ${numericMode(state).slice(1)} ${fileName}`;
}

/** Accept three octal digits, optionally prefixed with a leading zero. */
export function parseOctalMode(input: string): ChmodState | null {
  const value = input.trim();
  const digits = value.startsWith("0") && value.length === 4 ? value.slice(1) : value;
  if (!/^[0-7]{3}$/u.test(digits)) return null;

  const sets = digits.split("").map((digit) => {
    const bit = Number(digit);
    return {
      read: (bit & 4) !== 0,
      write: (bit & 2) !== 0,
      execute: (bit & 1) !== 0,
    };
  });

  return {
    owner: sets[0],
    group: sets[1],
    public: sets[2],
  };
}
