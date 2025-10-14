-- Allow unauthenticated users to view clientes list for login dropdown
CREATE POLICY "Usuarios no autenticados pueden ver lista de clientes"
ON public.clientes
FOR SELECT
TO anon
USING (true);