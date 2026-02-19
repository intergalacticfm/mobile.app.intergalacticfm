export function clickButton(id) {
    const btn = document.getElementById(id);
    if (!btn) throw new Error(`Button ${id} not found`);
    btn.click();
}
