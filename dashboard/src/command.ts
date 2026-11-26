/**
 * N4 command field: shows the next action (Enter runs it) and opens a filterable command list (click or ⌘K / Ctrl+K).
 * Arrow keys move, Enter runs, Esc closes. Actions come from the app; this module owns only the field and list.
 */
export interface Command {
  id: string;
  group: string;
  label: string;
  hint?: string;
  enabled: () => boolean;
  run: () => void;
}

export interface NextAction { label: string; detail: string; run: () => void; enabled: boolean }

export class CommandField {
  private open = false;
  private active = 0;
  private shown: Command[] = [];
  private next: NextAction | null = null;

  constructor(
    private field: HTMLElement, private text: HTMLElement, private go: HTMLButtonElement,
    private panel: HTMLElement, private input: HTMLInputElement, private list: HTMLElement,
    private commands: () => Command[],
  ) {
    field.addEventListener("click", (e) => { if (!(e.target as HTMLElement).closest(".cmd-go")) this.toggle(true); });
    go.addEventListener("click", () => this.runNext());
    input.addEventListener("input", () => { this.active = 0; this.renderList(); });
    input.addEventListener("keydown", (e) => this.onKey(e));
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); this.toggle(!this.open); }
      else if (e.key === "Escape" && this.open) this.toggle(false);
    });
    document.addEventListener("pointerdown", (e) => {
      if (this.open && !panel.contains(e.target as Node) && !field.contains(e.target as Node)) this.toggle(false);
    });
  }

  setNext(n: NextAction) {
    this.next = n;
    this.text.innerHTML = "";
    const b = document.createElement("b");
    b.textContent = n.label;
    this.text.append("Next: ", b, n.detail ? ` · ${n.detail}` : "");
    this.go.disabled = !n.enabled;
  }

  runNext() {
    if (this.next?.enabled) this.next.run();
  }

  toggle(on: boolean) {
    this.open = on;
    this.panel.hidden = !on;
    this.field.setAttribute("aria-expanded", String(on));
    if (on) { this.input.value = ""; this.active = 0; this.renderList(); this.input.focus(); }
  }

  private onKey(e: KeyboardEvent) {
    if (e.key === "ArrowDown") { this.active = Math.min(this.shown.length - 1, this.active + 1); this.renderList(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { this.active = Math.max(0, this.active - 1); this.renderList(); e.preventDefault(); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const c = this.shown[this.active];
      if (c) this.exec(c);
      else if (!this.input.value.trim()) { this.toggle(false); this.runNext(); }
    }
  }

  private exec(c: Command) {
    if (!c.enabled()) return;
    this.toggle(false);
    c.run();
  }

  private renderList() {
    const q = this.input.value.trim().toLowerCase();
    this.shown = this.commands().filter((c) => !q || `${c.group} ${c.label} ${c.hint ?? ""}`.toLowerCase().includes(q));
    this.list.replaceChildren();
    let group = "";
    this.shown.forEach((c, i) => {
      if (c.group !== group) {
        group = c.group;
        const h = document.createElement("li");
        h.className = "cmd-group";
        h.textContent = group;
        this.list.append(h);
      }
      const li = document.createElement("li");
      li.className = "cmd-item";
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(i === this.active));
      li.setAttribute("aria-disabled", String(!c.enabled()));
      const label = document.createElement("span");
      label.textContent = c.label;
      li.append(label);
      if (c.hint) { const h = document.createElement("span"); h.className = "cmd-hint"; h.textContent = c.hint; li.append(h); }
      li.addEventListener("pointerenter", () => { this.active = i; this.list.querySelectorAll(".cmd-item").forEach((x, j) => x.setAttribute("aria-selected", String(j === i))); });
      li.addEventListener("click", () => this.exec(c));
      this.list.append(li);
    });
    if (!this.shown.length) {
      const li = document.createElement("li");
      li.className = "cmd-empty";
      li.textContent = "No matching action";
      this.list.append(li);
    }
    this.list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }
}
