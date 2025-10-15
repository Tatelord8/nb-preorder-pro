-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Cliente puede ver productos según su tier" ON productos;

-- Create new policy that allows authenticated users to see all products
CREATE POLICY "Clientes pueden ver todos los productos"
ON productos
FOR SELECT
TO authenticated
USING (true);