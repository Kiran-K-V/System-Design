/** Logic for the A7.4 sandbox picker. Rules only use facts from the vendor pages cited in the lesson. */

export type Threat = 'trusted' | 'model' | 'hostile';
export type Load = 'scripts' | 'syscalls' | 'fulllinux';
export type Start = 'fast' | 'slow';

export interface Pick {
  choice: string;
  why: string[];
  watch: string;
}

export function pick(threat: Threat, load: Load, gpu: boolean, start: Start): Pick {
  const why: string[] = [];
  let choice: string;
  if (threat === 'trusted') {
    choice = 'OS-level sandbox on the process (bubblewrap or seatbelt) or a plain container';
    why.push('You wrote the code, so the risk is a model mistake or an injected prompt, not an attacker who wants the kernel.');
    why.push('Claude Code uses this level for shell commands. Anthropic reports 84% fewer permission prompts in its internal use.');
    if (load === 'fulllinux') why.push('Your load needs a full Linux environment. Use a container or VM you control.');
  } else if (gpu && threat === 'model') {
    choice = 'gVisor sandbox';
    why.push('On Modal, GPU sandboxes run only on gVisor.');
    why.push('gVisor answers system calls in a user-space kernel, so the container never reaches the host kernel directly.');
  } else if (threat === 'model' && load === 'scripts') {
    choice = 'gVisor sandbox (or a microVM)';
    why.push('A user-space kernel keeps system calls away from the host kernel, with no large fixed overhead.');
    why.push('Scripts make few system calls, so the per-call cost of gVisor stays small.');
  } else if (threat === 'model' && load === 'syscalls') {
    choice = 'microVM';
    why.push('gVisor has a higher cost per system call and the docs warn of poor performance for system-call-heavy work.');
    why.push('A microVM runs its own guest kernel, so system calls stay inside the VM at native speed.');
  } else if (load === 'fulllinux') {
    choice = 'microVM';
    why.push('Modal says its VM runtime is for work that needs a full Linux environment, such as Docker, FUSE, or nested cgroups.');
    why.push('gVisor does not implement every system call, so some programs will not run.');
  } else {
    choice = 'microVM';
    why.push('Other tenants write the code. A guest kernel behind a hardware (KVM) boundary is the strongest of these options.');
    why.push('Firecracker adds a jailer as a second line of defense if the virtual machine boundary is broken.');
    if (gpu) why.push('Check that your provider offers GPUs in a VM. On Modal, GPU sandboxes run only on gVisor.');
  }
  if (choice === 'microVM' && start === 'fast') why.push('Firecracker states a boot time under 125 ms. That is a vendor figure with no test conditions given. Measure your own.');
  if (choice === 'microVM' && start === 'slow') why.push('A multi-second start is fine here, so boot time does not limit the choice.');
  if (threat !== 'trusted') why.push('Whatever the box, still apply the policy layer: no ambient credentials, an egress allow list, a limited file view, and time and memory caps.');
  const watch = choice.startsWith('microVM')
    ? 'Memory per VM (Firecracker claims under 5 MiB of overhead, vendor figure) and the work to build and patch a guest image.'
    : choice.startsWith('gVisor')
      ? 'Per-call overhead on system-call-heavy code and programs that need an unimplemented system call.'
      : 'A shared host kernel: one kernel bug can end the isolation.';
  return { choice, why, watch };
}
