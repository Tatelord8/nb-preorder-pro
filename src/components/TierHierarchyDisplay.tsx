import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Shield, Award } from "lucide-react";
import { getAllTiers, type TierLevel } from '@/utils/tierHierarchy';

interface TierHierarchyDisplayProps {
  selectedTier?: TierLevel;
  onTierSelect?: (tier: TierLevel) => void;
  showSelection?: boolean;
}

const TierHierarchyDisplay: React.FC<TierHierarchyDisplayProps> = ({
  selectedTier,
  onTierSelect,
  showSelection = false
}) => {
  const tiers = getAllTiers();

  const getTierIcon = (tier: TierLevel) => {
    switch (tier) {
      case '0': return <Crown className="h-5 w-5 text-yellow-500" />;
      case '1': return <Star className="h-5 w-5 text-yellow-400" />;
      case '2': return <Shield className="h-5 w-5 text-gray-400" />;
      case '3': return <Award className="h-5 w-5 text-orange-500" />;
      default: return <Award className="h-5 w-5" />;
    }
  };

  const getTierBadgeVariant = (tier: TierLevel) => {
    switch (tier) {
      case '0': return 'default';
      case '1': return 'secondary';
      case '2': return 'outline';
      case '3': return 'destructive';
      default: return 'outline';
    }
  };

  const getTierColor = (tier: TierLevel) => {
    switch (tier) {
      case '0': return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case '1': return 'bg-gradient-to-r from-yellow-300 to-yellow-500';
      case '2': return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case '3': return 'bg-gradient-to-r from-orange-400 to-orange-600';
      default: return 'bg-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Jerarquía de Tiers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          Los tiers están ordenados de mayor a menor jerarquía. Tier 0 es el más alto.
        </div>
        
        <div className="space-y-3">
          {tiers.map((tier, index) => (
            <div
              key={tier.level}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedTier === tier.level 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              } ${
                showSelection && onTierSelect ? 'cursor-pointer' : ''
              }`}
              onClick={() => showSelection && onTierSelect?.(tier.level)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${getTierColor(tier.level)}`}>
                    {getTierIcon(tier.level)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getTierBadgeVariant(tier.level)}>
                        Tier {tier.level}
                      </Badge>
                      <span className="font-semibold">{tier.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tier.description}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium">
                    Prioridad: {tier.priority}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {index === 0 ? 'Más alto' : index === tiers.length - 1 ? 'Más bajo' : 'Intermedio'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {showSelection && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 Haz clic en un tier para seleccionarlo
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TierHierarchyDisplay;
