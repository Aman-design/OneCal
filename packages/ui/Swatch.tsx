import classNames from "@calcom/lib/classNames";

export type SwatchProps = {
  size?: "base" | "sm" | "lg";
  backgroundColor: string;
  onClick: () => void;
};

const Swatch = (props: SwatchProps) => {
  const { size, backgroundColor, onClick } = props;
  return (
    <div
      onClick={onClick}
      style={{ backgroundColor }}
      className={classNames(
        "cursor-pointer",
        size === "sm" && "border-brand-800 h-6 w-6 rounded-md border border-2",
        size === "base" && "h-16 w-16 rounded-md",
        size === "lg" && "h-24 w-24 rounded-md"
      )}
    />
  );
};

export default Swatch;
