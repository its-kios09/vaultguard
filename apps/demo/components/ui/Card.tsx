import React from "react";

type CardVariant = "default" | "purple" | "green" | "red" | "amber";

interface CardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({
  variant = "default",
  children,
  className = "",
  onClick,
}: CardProps) {
  return (
    <div
      className={`card ${variant !== "default" ? `card-${variant}` : ""} ${className}`}
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, action }: CardHeaderProps) {
  return (
    <div className="card-header">
      <div className="card-title">{title}</div>
      {action}
    </div>
  );
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function CardBody({ children, className = "" }: CardBodyProps) {
  return (
    <div className={`card-body ${className}`}>
      {children}
    </div>
  );
}
