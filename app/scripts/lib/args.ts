/** Kleine opdrachtregel-lezer: `--naam waarde` of `--vlag`. */
export function leesArgs(argv = process.argv.slice(2)): Map<string, string> {
  const args = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const sleutel = a.slice(2);
    const volgende = argv[i + 1];
    if (volgende !== undefined && !volgende.startsWith('--')) {
      args.set(sleutel, volgende);
      i++;
    } else args.set(sleutel, 'ja');
  }
  return args;
}
