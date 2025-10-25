import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getTierInfo, getTierName, type TierLevel } from '@/utils/tierHierarchy';

interface TierSelectorProps {
  value?: TierLevel;
  onValueChange: (value: TierLevel) => void;
  label?: string;
  placeholder?: string;
  showDescription?: boolean;
  disabled?: boolean;
}

const TierSelector: React.FC<TierSelectorProps> = ({
  value,
  onValueChange,
  label = "Tier",
  placeholder = "Seleccionar tier",
  showDescription = false,
  disabled = false
}) => {
  const tiers = [
    { level: '0' as TierLevel, name: 'Premium', description: 'Tier más alto - Acceso completo' },
    { level: '1' as TierLevel, name: 'Gold', description: 'Tier alto - Acceso amplio' },
    { level: '2' as TierLevel, name: 'Silver', description: 'Tier medio - Acceso estándar' },
    { level: '3' as TierLevel, name: 'Bronze', description: 'Tier bajo - Acceso básico' }
  ];

  const getTierBadgeVariant = (tier: TierLevel) => {
    switch (tier) {
      case '0': return 'default'; // Premium - más destacado
      case '1': return 'secondary'; // Gold
      case '2': return 'outline'; // Silver
      case '3': return 'destructive'; // Bronze
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="tier-selector">{label}</Label>
      <Select 
        value={value} 
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger id="tier-selector">
          <SelectValue placeholder={placeholder}>
            {value && (
              <div className="flex items-center gap-2">
                <Badge variant={getTierBadgeVariant(value)}>
                  {getTierName(value)}
                </Badge>
                {showDescription && (
                  <span className="text-sm text-muted-foreground">
                    {getTierInfo(value).description}
                  </span>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {tiers.map((tier) => (
            <SelectItem key={tier.level} value={tier.level}>
              <div className="flex items-center gap-2">
                <Badge variant={getTierBadgeVariant(tier.level)}>
                  {tier.name}
                </Badge>
                <span className="text-sm">{tier.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TierSelector;
