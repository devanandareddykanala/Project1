interface DevelvynLogoProps {
  size?: number;
  clickable?: boolean;
  onClick?: () => void;
}

/**
 * Develvyn inline SVG logo — green rounded square with a white D
 * that has a lightning bolt cut diagonally through the left vertical stroke.
 */
export function DevelvynLogo({
  size = 32,
  clickable = false,
  onClick,
}: DevelvynLogoProps) {
  const Tag = clickable ? "button" : "div";

  return (
    <Tag
      {...(clickable
        ? {
            type: "button" as const,
            onClick,
            "aria-label": "Develvyn home",
            style: {
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "inline-flex",
            },
          }
        : {})}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Develvyn"
        style={{ display: "block", flexShrink: 0 }}
      >
        {/* Green rounded square background */}
        <rect width="64" height="64" rx="14" fill="#22C55E" />

        {/*
          White D with lightning bolt cut through left vertical stroke.
          The D is ~60% of the 64x64 square, centered.
          Left vertical: x=15..23, y=12..52
          Right curve from top-right of vertical to bottom-right.
          Lightning bolt cut: diagonal slash from (15,26) -> (23,22) -> (15,38) -> (23,34)
          This creates a zigzag notch in the left vertical.
        */}
        <path
          d="
            M 23 12
            L 34 12
            Q 50 12 50 32
            Q 50 52 34 52
            L 23 52
            L 23 38
            L 15 42
            L 23 34
            L 15 28
            L 23 24
            Z
            M 31 20
            L 31 20
            Q 42 20 42 32
            Q 42 44 31 44
            L 30 44
            L 30 20
            Z
          "
          fill="white"
          fillRule="evenodd"
        />
      </svg>
    </Tag>
  );
}
