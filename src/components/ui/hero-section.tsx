import { Button } from "./button";
import { Badge } from "./badge";
import { ArrowRightIcon } from "lucide-react";
import { Mockup, MockupFrame } from "./mockup";
import { Glow } from "./glow";
import { useAppStore } from "../../store";
import { cn } from "../../lib/utils";
import React from "react";

interface HeroAction {
  text: string;
  href?: string;
  icon?: React.ReactNode;
  variant?: "default" | "glow" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  onClick?: () => void;
}

interface HeroProps {
  badge?: {
    text: string;
    action: {
      text: string;
      href: string;
    };
  };
  title: string;
  description: string;
  actions: HeroAction[];
  image: {
    light: string;
    dark: string;
    alt: string;
  };
}

export function HeroSection({
  badge,
  title,
  description,
  actions,
  image,
}: HeroProps) {
  const { theme } = useAppStore();
  const imageSrc = theme === "light" ? image.light : image.dark;

  return (
    <section
      className={cn(
        "bg-[var(--bg)] text-[var(--text-main)]",
        "py-12 sm:py-24 md:py-32 px-4",
        "fade-bottom overflow-hidden pb-0 relative"
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-12 pt-16 sm:gap-24 relative z-10">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-12">
          {/* Badge */}
          {badge && (
            <Badge variant="outline" className="animate-appear gap-2">
              <span className="text-[var(--text-muted)]">{badge.text}</span>
              <a href={badge.action.href} className="flex items-center gap-1 font-semibold hover:underline">
                {badge.action.text}
                <ArrowRightIcon className="h-3 w-3" />
              </a>
            </Badge>
          )}

          {/* Title */}
          <h1 className="relative z-10 inline-block animate-appear bg-gradient-to-r from-[var(--text-main)] to-[var(--text-muted)] bg-clip-text text-4xl font-semibold leading-[1.1] text-transparent drop-shadow-2xl sm:text-6xl md:text-[5rem]">
            {title}
          </h1>

          {/* Description */}
          <p className="text-md relative z-10 max-w-[550px] animate-appear font-medium text-[var(--text-muted)] opacity-0 delay-100 sm:text-xl">
            {description}
          </p>

          {/* Actions */}
          <div className="relative z-10 flex flex-wrap animate-appear justify-center gap-4 opacity-0 delay-300">
            {actions.map((action, index) => {
              if (action.onClick || !action.href) {
                return (
                  <Button key={index} variant={action.variant} size="lg" onClick={action.onClick} className="flex items-center gap-2 cursor-pointer">
                    {action.icon}
                    {action.text}
                  </Button>
                );
              }
              return (
                <Button key={index} variant={action.variant} size="lg" asChild>
                  <a href={action.href} className="flex items-center gap-2 cursor-pointer">
                    {action.icon}
                    {action.text}
                  </a>
                </Button>
              );
            })}
          </div>

          {/* Image with Glow */}
          <div className="relative pt-12 w-full max-w-5xl">
            <MockupFrame
              className="animate-appear opacity-0 delay-700"
              size="small"
            >
              <Mockup type="responsive">
                <img
                  src={imageSrc}
                  alt={image.alt}
                  className="w-full h-auto aspect-[16/9] object-cover"
                  referrerPolicy="no-referrer"
                />
              </Mockup>
            </MockupFrame>
            <Glow
              variant="top"
              className="animate-appear-zoom opacity-0 delay-1000 -z-10"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
