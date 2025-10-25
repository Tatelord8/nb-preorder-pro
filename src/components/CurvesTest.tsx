/**
 * Componente de prueba para el sistema de curvas predefinidas
 * Este componente puede ser eliminado después de las pruebas
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  getAllCurves, 
  getCurvesForGender, 
  getCurveInfo, 
  applyCurveToProduct,
  type PredefinedCurve 
} from '@/utils/predefinedCurves';

const CurvesTest: React.FC = () => {
  const [selectedGender, setSelectedGender] = useState('Mens');
  const [selectedOption, setSelectedOption] = useState(1);
  const [numberOfCurves, setNumberOfCurves] = useState(1);
  const [testResults, setTestResults] = useState<string>('');

  const genders = ['Mens', 'Womens', 'Unisex', 'Preschool', 'Infant', 'Gradeschool', 'Youth'];

  const handleTestSpecificCurve = () => {
    const curveInfo = getCurveInfo(selectedGender, selectedOption);
    const appliedCurve = applyCurveToProduct(selectedGender, selectedOption, numberOfCurves);
    const total = Object.values(appliedCurve).reduce((sum, qty) => sum + qty, 0);
    
    setTestResults(`
Curva: ${selectedGender} - Opción ${selectedOption}
Número de curvas: ${numberOfCurves}
Total de unidades: ${total}

Tallas y cantidades:
${Object.entries(appliedCurve).map(([talla, cantidad]) => 
  `  ${talla}: ${cantidad} unidades`
).join('\n')}
    `);
  };

  const handleTestAllCurves = () => {
    const allCurves = getAllCurves();
    let results = '🧪 Pruebas de todas las curvas predefinidas:\n\n';
    
    allCurves.forEach((curve, index) => {
      const applied = applyCurveToProduct(curve.genero, curve.opcion, 1);
      const calculatedTotal = Object.values(applied).reduce((sum, qty) => sum + qty, 0);
      const matches = calculatedTotal === curve.total;
      
      results += `${index + 1}. ${curve.genero} - Opción ${curve.opcion}\n`;
      results += `   Total esperado: ${curve.total}\n`;
      results += `   Total calculado: ${calculatedTotal}\n`;
      results += `   ${matches ? '✅ CORRECTO' : '❌ ERROR'}\n\n`;
    });
    
    setTestResults(results);
  };

  const handleTestGenderCurves = () => {
    const curves = getCurvesForGender(selectedGender);
    let results = `🧪 Curvas disponibles para ${selectedGender}:\n\n`;
    
    curves.forEach((curve, index) => {
      results += `${index + 1}. Opción ${curve.opcion} (Total: ${curve.total} unidades)\n`;
    });
    
    setTestResults(results);
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">🧪 Pruebas del Sistema de Curvas Predefinidas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="gender-select">Género</Label>
            <Select value={selectedGender} onValueChange={setSelectedGender}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {genders.map((gender) => (
                  <SelectItem key={gender} value={gender}>
                    {gender}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="option-select">Opción</Label>
            <Select value={selectedOption.toString()} onValueChange={(value) => setSelectedOption(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getCurvesForGender(selectedGender).map((curve) => (
                  <SelectItem key={curve.opcion} value={curve.opcion.toString()}>
                    Opción {curve.opcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="curves-number">Número de Curvas</Label>
            <Input
              id="curves-number"
              type="number"
              min="1"
              max="10"
              value={numberOfCurves}
              onChange={(e) => setNumberOfCurves(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>
        
        <div className="flex gap-2 mb-4">
          <Button onClick={handleTestSpecificCurve} variant="outline">
            Probar Curva Específica
          </Button>
          <Button onClick={handleTestGenderCurves} variant="outline">
            Ver Curvas del Género
          </Button>
          <Button onClick={handleTestAllCurves} variant="default">
            Probar Todas las Curvas
          </Button>
        </div>
        
        {testResults && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Resultados:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {testResults}
            </pre>
          </div>
        )}
      </Card>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">📋 Resumen de Curvas Disponibles</h3>
        
        <div className="space-y-4">
          {genders.map((gender) => {
            const curves = getCurvesForGender(gender);
            return (
              <div key={gender}>
                <h4 className="font-medium mb-2">{gender}</h4>
                <div className="flex flex-wrap gap-2">
                  {curves.map((curve) => (
                    <Badge key={curve.opcion} variant="outline">
                      Opción {curve.opcion} ({curve.total} unidades)
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default CurvesTest;
