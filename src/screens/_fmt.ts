// tiny path/base-name helper shared by screens
export function baseName(p?: string): string {
  if (!p) return '';
  return p.split('/').pop() ?? p;
}
