import React from "react";

type Variant = "default" | "primary" | "destructive" | "secondary"; // ✅ เพิ่ม secondary

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "default",
  ...props
}) => {
  const base = "px-4 py-2 rounded text-white transition font-medium";
  const styles: Record<Variant, string> = {
    default: "bg-gray-500 hover:bg-gray-600",
    primary: "bg-blue-500 hover:bg-blue-600",
    destructive: "bg-red-500 hover:bg-red-600",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300", // ✅ เพิ่มตรงนี้
  };

  return (
    <button
      {...props}
      className={`${base} ${styles[variant]} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
};

export default Button;
