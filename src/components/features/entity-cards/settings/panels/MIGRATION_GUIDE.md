# Guía de Migración para Paneles de Configuración

Esta guía proporciona instrucciones para migrar los paneles de configuración antiguos al nuevo sistema de formularios y layouts.

## Componentes del Nuevo Sistema

### Layouts
- **FormLayout**: Contenedor principal para formularios
- **FormSection**: Agrupa campos relacionados en secciones
- **FormRow**: Organiza campos en filas (grid)
- **FormGroup**: Agrupa campos con un borde y estilo común

### Campos de Formulario
- **FormToggle**: Reemplaza ToggleOption para opciones de activación/desactivación
- **FormSlider**: Para valores numéricos con slider
- **FormSelect**: Para opciones de selección
- **FormInput**: Para entradas de texto
- **FormAlert**: Para mostrar alertas o mensajes

## Pasos para la Migración

1. **Importar los componentes nuevos**:
   ```typescript
   import {
     FormGroup,
     FormLayout,
     FormRow,
     FormSection,
     FormSelect,
     FormSlider,
     FormToggle,
     FormInput,
     createNestedOptionChangeHandler,
     panelColors
   } from './shared';
   ```

2. **Reemplazar Card por FormLayout**:
   ```typescript
   // Antes
   <Card className={cn('w-full', panelColors.advanced.bg, panelColors.advanced.border)}>
     <CardHeader>...</CardHeader>
     <CardContent>...</CardContent>
   </Card>

   // Después
   <FormLayout
     title="Título del Panel"
     description="Descripción del panel"
     colorScheme="design" // Usar: design, visual, advanced, states, system, etc.
     variant="colored"
     maxHeight={500}
   >
     {/* contenido */}
   </FormLayout>
   ```

3. **Reemplazar ToggleOption por FormToggle**:
   ```typescript
   // Antes
   <ToggleOption
     id="feature-enabled"
     label="Activar Característica"
     description="Descripción de la característica"
     checked={options.enabled}
     onCheckedChange={(value) => handleChange('enabled', value)}
     disabled={disabled}
   />

   // Después
   <FormToggle
     id="feature-enabled"
     label="Activar Característica"
     description="Descripción de la característica"
     checked={options.enabled}
     onCheckedChange={(checked) => handleChange('enabled', checked)}
     disabled={disabled}
     icon={<IconComponent className="h-3.5 w-3.5 text-muted-foreground" />} // Opcional
   />
   ```

4. **Reemplazar Select por FormSelect**:
   ```typescript
   // Antes
   <FormItem className="space-y-1">
     <FormLabel className="text-[10px]">Etiqueta</FormLabel>
     <Select
       value={options.value}
       onValueChange={(value) => handleChange('value', value)}
       disabled={disabled}
     >
       <SelectTrigger className="h-8 text-[10px]">
         <SelectValue placeholder="Seleccionar" />
       </SelectTrigger>
       <SelectContent>
         <SelectItem value="option1">Opción 1</SelectItem>
         <SelectItem value="option2">Opción 2</SelectItem>
       </SelectContent>
     </Select>
   </FormItem>

   // Después
   <FormSelect
     id="feature-select"
     label="Etiqueta"
     description="Descripción opcional"
     value={options.value}
     onValueChange={(value) => handleChange('value', value)}
     disabled={disabled}
     options={[
       { value: 'option1', label: 'Opción 1' },
       { value: 'option2', label: 'Opción 2' }
     ]}
     icon={<IconComponent className="h-3.5 w-3.5 text-muted-foreground" />} // Opcional
   />
   ```

5. **Reemplazar Slider por FormSlider**:
   ```typescript
   // Antes
   <FormItem className="space-y-1">
     <FormLabel className="text-[10px]">Etiqueta</FormLabel>
     <div className="flex items-center gap-2">
       <Slider
         value={[options.value]}
         min={0}
         max={100}
         step={1}
         onValueChange={([value]) => handleChange('value', value)}
         disabled={disabled}
         className="flex-1"
       />
       <span className="text-[10px] text-muted-foreground w-8">
         {options.value}%
       </span>
     </div>
   </FormItem>

   // Después
   <FormSlider
     id="feature-slider"
     label="Etiqueta"
     description="Descripción opcional"
     value={options.value}
     onValueChange={(value) => handleChange('value', value)}
     min={0}
     max={100}
     step={1}
     unit="%" // Opcional
     disabled={disabled}
     icon={<IconComponent className="h-3.5 w-3.5 text-muted-foreground" />} // Opcional
   />
   ```

6. **Reemplazar Input por FormInput**:
   ```typescript
   // Antes
   <FormItem className="space-y-1">
     <FormLabel className="text-[10px]">Etiqueta</FormLabel>
     <Input
       type="text"
       value={options.value}
       onChange={(e) => handleChange('value', e.target.value)}
       className="h-8 text-[10px]"
       disabled={disabled}
     />
   </FormItem>

   // Después
   <FormInput
     id="feature-input"
     label="Etiqueta"
     description="Descripción opcional"
     value={options.value}
     onChange={(value) => handleChange('value', value)}
     type="text" // Opcional, por defecto es "text"
     placeholder="Placeholder" // Opcional
     disabled={disabled}
     icon={<IconComponent className="h-3.5 w-3.5 text-muted-foreground" />} // Opcional
   />
   ```

7. **Organizar campos en grupos y secciones**:
   ```typescript
   <FormSection
     title="Título de Sección"
     description="Descripción de la sección"
     colorScheme="advanced" // Opcional
   >
     <FormGroup>
       <FormRow>
         <FormToggle ... />
         <FormSelect ... />
       </FormRow>

       <FormRow cols={1}> {/* cols puede ser 1, 2, 3 o 4 */}
         <FormInput ... />
       </FormRow>
     </FormGroup>
   </FormSection>
   ```

8. **Extraer componentes para mejor organización**:
   ```typescript
   // Componente de sección
   const SectionComponent = ({
     options,
     handleChange,
     disabled
   }) => {
     return (
       <FormSection
         title="Título de Sección"
         description="Descripción de la sección"
         colorScheme="design"
       >
         <FormGroup>
           {/* campos */}
         </FormGroup>
       </FormSection>
     );
   };

   // En el componente principal
   return (
     <FormLayout ...>
       <FormToggle ... />

       {options.enabled && (
         <div className="mt-4 space-y-6">
           <SectionComponent
             options={options}
             handleChange={handleChange}
             disabled={disabled}
           />
           {/* más secciones */}
         </div>
       )}
     </FormLayout>
   );
   ```

## Ejemplo Completo

Puedes encontrar ejemplos completos de implementación en:
- `src/components/features/entity-cards/settings/panels/core-settings.tsx`
- `src/components/features/entity-cards/settings/panels/backside-settings.tsx`

## Estrategia de Migración

1. Identifica los paneles menos complejos para migrar primero
2. Migra sección por sección dentro de cada panel
3. Prueba cada panel después de migrarlo
4. Asegúrate de que los datos se siguen enviando correctamente

## Soporte

Si hay problemas durante la migración, revisa la implementación de:
- `src/components/features/entity-cards/settings/panels/shared/form-layout.tsx`
- `src/components/features/entity-cards/settings/panels/shared/form-fields.tsx`