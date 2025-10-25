/**
 * Componente de prueba para el generador de tallas
 * Este componente puede ser eliminado después de las pruebas
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { generateSizes, getSizeInfo, type ProductSizeInfo } from '@/utils/sizeGenerator';
import { runSizeGeneratorTests, testSpecificCase } from '@/utils/testSizeGenerator';

const SizeGeneratorTest: React.FC = () => {
  const [rubro, setRubro] = useState('Calzados');
  const [genero, setGenero] = useState('Mens');
  const [testResults, setTestResults] = useState<string>('');

  const handleTest = () => {
    const product: ProductSizeInfo = { rubro, genero };
    const sizes = generateSizes(product);
    const sizeInfo = getSizeInfo(product);
    
    setTestResults(`
Producto: ${rubro} - ${genero}
Tallas generadas: ${sizes.join(', ')}
Tipo: ${sizeInfo.type}
Descripción: ${sizeInfo.description}
    `);
  };

  const handleRunAllTests = () => {
    // Capturar console.log para mostrar en la UI
    const originalLog = console.log;
    let logOutput = '';
    
    console.log = (...args) => {
      logOutput += args.join(' ') + '\n';
      originalLog(...args);
    };
    
    runSizeGeneratorTests();
    console.log = originalLog;
    
    setTestResults(logOutput);
  };

  const handleTestSpecific = () => {
    const originalLog = console.log;
    let logOutput = '';
    
    console.log = (...args) => {
      logOutput += args.join(' ') + '\n';
      originalLog(...args);
    };
    
    testSpecificCase(rubro, genero);
    console.log = originalLog;
    
    setTestResults(logOutput);
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">🧪 Pruebas del Generador de Tallas</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="rubro">Rubro</Label>
            <Select value={rubro} onValueChange={setRubro}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Calzados">Calzados</SelectItem>
                <SelectItem value="Prendas">Prendas</SelectItem>
                <SelectItem value="Accesorios">Accesorios</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="genero">Género</Label>
            <Select value={genero} onValueChange={setGenero}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mens">Mens</SelectItem>
                <SelectItem value="Womens">Womens</SelectItem>
                <SelectItem value="Unisex">Unisex</SelectItem>
                <SelectItem value="Preschool">Preschool</SelectItem>
                <SelectItem value="Gradeschool">Gradeschool</SelectItem>
                <SelectItem value="Infant">Infant</SelectItem>
                <SelectItem value="Youth">Youth</SelectItem>
                <SelectItem value="Hombre">Hombre</SelectItem>
                <SelectItem value="Mujer">Mujer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex gap-2 mb-4">
          <Button onClick={handleTest} variant="outline">
            Probar Caso Específico
          </Button>
          <Button onClick={handleTestSpecific} variant="outline">
            Probar con Console
          </Button>
          <Button onClick={handleRunAllTests} variant="default">
            Ejecutar Todas las Pruebas
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
        <h3 className="text-lg font-semibold mb-4">📋 Casos de Prueba Esperados</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Calzados Mens:</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13'].map(size => (
                <Badge key={size} variant="outline">{size}</Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium">Calzados Womens:</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'].map(size => (
                <Badge key={size} variant="outline">{size}</Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium">Calzados Unisex:</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {['4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13'].map(size => (
                <Badge key={size} variant="outline">{size}</Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium">Prendas Mens:</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(size => (
                <Badge key={size} variant="secondary">{size}</Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium">Prendas Womens:</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                <Badge key={size} variant="secondary">{size}</Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium">Calzados Preschool:</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {['10.5', '11', '11.5', '12', '12.5', '13', '13.5', '1', '1.5', '2', '2.5', '3'].map(size => (
                <Badge key={size} variant="outline">{size}</Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium">Calzados Infant:</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {['5', '6', '7', '8', '9', '10'].map(size => (
                <Badge key={size} variant="outline">{size}</Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium">Calzados Gradeschool:</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {['3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7'].map(size => (
                <Badge key={size} variant="outline">{size}</Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium">Calzados Youth:</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {['10.5', '11', '11.5', '12', '12.5', '13', '13.5', '1', '1.5', '2', '2.5', '3'].map(size => (
                <Badge key={size} variant="outline">{size}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SizeGeneratorTest;
