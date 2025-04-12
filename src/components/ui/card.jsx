export const Card = ({ children, ...props }) => (
  <div className="bg-white dark:bg-zinc-800 shadow rounded-lg" {...props}>
    {children}
  </div>
);
