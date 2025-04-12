export const Button = ({ children, variant = "default", ...props }) => {
  const base = "px-4 py-2 rounded font-semibold";
  const style =
    variant === "destructive"
      ? "bg-red-600 text-white"
      : variant === "secondary"
      ? "bg-gray-300 text-black"
      : "bg-blue-600 text-white";
  return (
    <button className={`${base} ${style}`} {...props}>
      {children}
    </button>
  );
};
