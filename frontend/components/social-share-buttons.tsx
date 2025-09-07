"use client";

import { useState } from "react";
import { Share2, Facebook, Instagram, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "./whatsapp-icon";

interface SocialShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  variant?: "default" | "compact" | "inline";
}

export function SocialShareButtons({
  url,
  title,
  description = "",
  className,
  variant = "default"
}: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareData = {
    whatsapp: {
      url: `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`,
      label: "WhatsApp",
      icon: WhatsAppIcon,
      color: "bg-green-500 hover:bg-green-600"
    },
    facebook: {
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`,
      label: "Facebook",
      icon: Facebook,
      color: "bg-blue-600 hover:bg-blue-700"
    },
    twitter: {
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      label: "Twitter",
      icon: Twitter,
      color: "bg-black hover:bg-gray-800"
    },
    instagram: {
      url: url, // Instagram doesn't support direct URL sharing, so we'll copy to clipboard
      label: "Instagram",
      icon: Instagram,
      color: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
    }
  };

  const handleShare = (platform: keyof typeof shareData) => {
    if (platform === "instagram") {
      // For Instagram, copy URL to clipboard since direct sharing isn't supported
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
      return;
    }

    window.open(
      shareData[platform].url,
      "_blank",
      "width=600,height=400,scrollbars=yes,resizable=yes"
    );
  };

  if (variant === "compact") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("flex items-center gap-2", className)}
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {Object.entries(shareData).map(([platform, data]) => {
            const Icon = data.icon;
            return (
              <DropdownMenuItem
                key={platform}
                onClick={() => handleShare(platform as keyof typeof shareData)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Icon className="w-4 h-4" />
                {platform === "instagram" && copied ? "Copied!" : data.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-sm font-medium text-gray-600 mr-2">Share:</span>
        {Object.entries(shareData).map(([platform, data]) => {
          const Icon = data.icon;
          return (
            <Button
              key={platform}
              variant="ghost"
              size="sm"
              onClick={() => handleShare(platform as keyof typeof shareData)}
              className="p-2 h-8 w-8 rounded-full hover:scale-110 transition-transform cursor-pointer"
              title={`Share on ${data.label}`}
            >
              <Icon className="w-4 h-4" />
            </Button>
          );
        })}
      </div>
    );
  }

  // Default variant - individual buttons
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {Object.entries(shareData).map(([platform, data]) => {
        const Icon = data.icon;
        return (
          <Button
            key={platform}
            onClick={() => handleShare(platform as keyof typeof shareData)}
            className={cn(
              "flex items-center gap-2 text-white transition-all duration-200 hover:scale-105",
              data.color
            )}
            size="sm"
          >
            <Icon className="w-4 h-4" />
            {platform === "instagram" && copied ? "Copied!" : data.label}
          </Button>
        );
      })}
    </div>
  );
}

export default SocialShareButtons;