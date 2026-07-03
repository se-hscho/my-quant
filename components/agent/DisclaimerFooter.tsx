export function DisclaimerFooter({ text }: { text: string }) {
  return (
    <footer
      className="border-t pt-4 text-center text-xs text-muted-foreground"
      data-testid="disclaimer-footer"
    >
      {text}
    </footer>
  );
}
