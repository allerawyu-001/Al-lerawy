export function Footer() {
  return (
    <footer className="mt-32 border-t border-border/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-6 py-16 md:grid-cols-4">
        <div className="col-span-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-3xl tracking-wider">AL-</span><span className="font-display text-3xl tracking-wider text-gold">LERAWY</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            A marketplace for considered headwear. Small batches, independent makers, custom commissions.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li>All caps</li>
            <li>New arrivals</li>
            <li>Limited</li>
            <li>Custom</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">Studio</h4>
          <ul className="space-y-2 text-sm">
            <li>Become a maker</li>
            <li>Producer dashboard</li>
            <li>Press</li>
            <li>Contact</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} AL-LERAWY Atelier</span>
          <span className="tracking-widest">CRAFT · COMMERCE · COMMUNITY</span>
        </div>
      </div>
    </footer>
  );
}
