/**
 * Componente para seleccionar curvas predefinidas
 * Muestra las opciones disponibles según el género del producto
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  getCurvesForGender, 
  getCurveInfo, 
  applyCurveToProduct,
  type CurveOption 
} from '@/utils/predefinedCurves';

interface PredefinedCurvesSelectorProps {
  genero: string;
  onCurveSelected: (curveData: {
    genero: string;
    opcion: number;
    numberOfCurves: number;
    quantities: Record<string, number>;
    total: number;
  }) => void;
  selectedCurve?: {
    genero: string;
    opcion: number;
    numberOfCurves: number;
  };
}

const PredefinedCurvesSelector: React.FC<PredefinedCurvesSelectorProps> = ({
  genero,
  onCurveSelected,
  selectedCurve
}) => {
  const [availableCurves, setAvailableCurves] = useState<CurveOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<number>(1);
  const [numberOfCurves, setNumberOfCurves] = useState<number>(1);
  const [curveInfo, setCurveInfo] = useState<any>(null);
  const [appliedCurve, setAppliedCurve] = useState<Record<string, number>>({});

  useEffect(() => {
    if (genero) {
      const curves = getCurvesForGender(genero);
      setAvailableCurves(curves);
      
      if (curves.length > 0) {
        const firstOption = curves[0].opcion;
        setSelectedOption(firstOption);
        updateCurveInfo(genero, firstOption, numberOfCurves);
      }
    }
  }, [genero, numberOfCurves]);

  useEffect(() => {
    if (selectedCurve) {
      setSelectedOption(selectedCurve.opcion);
      setNumberOfCurves(selectedCurve.numberOfCurves);
      updateCurveInfo(selectedCurve.genero, selectedCurve.opcion, selectedCurve.numberOfCurves);
    }
  }, [selectedCurve]);

  const updateCurveInfo = (genero: string, opcion: number, curves: number) => {
    const info = getCurveInfo(genero, opcion);
    if (info) {
      setCurveInfo(info);
      const applied = applyCurveToProduct(genero, opcion, curves);
      setAppliedCurve(applied);
    }
  };

  const handleOptionChange = (opcion: number) => {
    setSelectedOption(opcion);
    updateCurveInfo(genero, opcion, numberOfCurves);
  };

  const handleCurvesChange = (curves: number) => {
    setNumberOfCurves(curves);
    updateCurveInfo(genero, selectedOption, curves);
  };

  const handleApplyCurve = () => {
    if (curveInfo) {
      const total = Object.values(appliedCurve).reduce((sum, qty) => sum + qty, 0);
      
      onCurveSelected({
        genero,
        opcion: selectedOption,
        numberOfCurves,
        quantities: appliedCurve,
        total
      });
    }
  };

  if (!genero) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground">Selecciona un género para ver las curvas disponibles</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Curvas Predefinidas - {genero}
          </h3>
          <p className="text-sm text-muted-foreground">
            Selecciona una curva predefinida para aplicar al producto
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="curve-option">Opción de Curva</Label>
            <Select value={selectedOption.toString()} onValueChange={(value) => handleOptionChange(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCurves.map((curve) => (
                  <SelectItem key={curve.opcion} value={curve.opcion.toString()}>
                    {curve.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="number-of-curves">Número de Curvas</Label>
            <Input
              id="number-of-curves"
              type="number"
              min="1"
              max="10"
              value={numberOfCurves}
              onChange={(e) => handleCurvesChange(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        {curveInfo && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Vista Previa de la Curva</h4>
              <Badge variant="outline">
                Total: {Object.values(appliedCurve).reduce((sum, qty) => sum + qty, 0)} unidades
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.entries(appliedCurve).map(([talla, cantidad]) => (
                <div key={talla} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{talla}</span>
                  <Badge variant="secondary">{cantidad}</Badge>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleApplyCurve} className="flex-1">
                Aplicar Curva
              </Button>
            </div>
          </div>
        )}

        {availableCurves.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No hay curvas predefinidas disponibles para el género "{genero}"
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PredefinedCurvesSelector;
