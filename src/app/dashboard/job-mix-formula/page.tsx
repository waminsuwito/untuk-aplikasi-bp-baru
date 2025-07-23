'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, PlusCircle, Trash2, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getFormulas, saveFormulas, addFormula, updateFormula, deleteFormula, type JobMixFormula } from '@/lib/formula';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const MATERIAL_LABELS_KEY = 'app-material-labels';

const defaultMaterialLabels = {
  pasir1: 'Pasir 1',
  pasir2: 'Pasir 2',
  batu1: 'Batu 1',
  batu2: 'Batu 2',
  batu3: 'Batu 3',
  batu4: 'Batu 4',
  semen: 'Semen',
  air: 'Air',
  additive1: 'Additive 1',
  additive2: 'Additive 2',
  additive3: 'Additive 3',
};

const mutuCodeOptions = ["BPM", "BPG", "BPS", "BK", "BPP"];

type MaterialKey = keyof typeof defaultMaterialLabels;

const EditableLabel = React.memo(({ labelKey, value, onChange }: { labelKey: MaterialKey, value: string, onChange: (key: MaterialKey, value: string) => void }) => {
    return (
        <div className="flex flex-col space-y-2">
            <Input 
              value={value}
              onChange={(e) => onChange(labelKey, e.target.value)}
              className="font-medium text-sm p-1 h-auto border-dashed"
            />
             <span className="text-xs text-muted-foreground">(Kg)</span>
        </div>
    )
});
EditableLabel.displayName = 'EditableLabel';

const formulaSchema = z.object({
  mutuBeton: z.string().min(1, 'Mutu Beton is required.'),
  mutuCode: z.string().optional(),
  pasir1: z.coerce.number().min(0, 'Value must be positive.'),
  pasir2: z.coerce.number().min(0, 'Value must be positive.'),
  batu1: z.coerce.number().min(0, 'Value must be positive.'),
  batu2: z.coerce.number().min(0, 'Value must be positive.'),
  batu3: z.coerce.number().min(0, 'Value must be positive.'),
  batu4: z.coerce.number().min(0, 'Value must be positive.'),
  semen: z.coerce.number().min(0, 'Value must be positive.'),
  air: z.coerce.number().min(0, 'Value must be positive.'),
  additive1: z.coerce.number().min(0, 'Value must be positive.'),
  additive2: z.coerce.number().min(0, 'Value must be positive.'),
  additive3: z.coerce.number().min(0, 'Value must be positive.'),
});

type FormulaFormValues = z.infer<typeof formulaSchema>;

const formDefaultValues: FormulaFormValues = {
  mutuBeton: '',
  mutuCode: '',
  pasir1: 0,
  pasir2: 0,
  batu1: 0,
  batu2: 0,
  batu3: 0,
  batu4: 0,
  semen: 0,
  air: 0,
  additive1: 0,
  additive2: 0,
  additive3: 0,
};

function FormulaManagerPage() {
  const [formulas, setFormulas] = useState<JobMixFormula[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingFormula, setEditingFormula] = useState<JobMixFormula | null>(null);
  const [materialLabels, setMaterialLabels] = useState(defaultMaterialLabels);
  const { toast } = useToast();

  const form = useForm<FormulaFormValues>({
    resolver: zodResolver(formulaSchema),
    defaultValues: formDefaultValues,
  });

  const fetchFormulas = useCallback(async () => {
    setIsLoading(true);
    const data = await getFormulas();
    setFormulas(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchFormulas();
    try {
        const storedLabels = localStorage.getItem(MATERIAL_LABELS_KEY);
        if (storedLabels) {
            setMaterialLabels(JSON.parse(storedLabels));
        }
    } catch (e) { console.error("Failed to load material labels", e); }
  }, [fetchFormulas]);

  const handleLabelChange = (key: MaterialKey, value: string) => {
    setMaterialLabels(prev => ({...prev, [key]: value }));
  };
  
  const saveMaterialLabels = () => {
    try {
        localStorage.setItem(MATERIAL_LABELS_KEY, JSON.stringify(materialLabels));
        toast({ title: "Label Disimpan", description: "Nama material telah diperbarui."})
    } catch(e) {
        toast({ variant: 'destructive', title: "Gagal Menyimpan", description: "Tidak dapat menyimpan label material."})
    }
  }

  useEffect(() => {
    if (editingFormula) {
      form.reset({
        ...editingFormula,
        mutuCode: editingFormula.mutuCode || ''
      });
    } else {
      form.reset(formDefaultValues);
    }
  }, [editingFormula, form]);

  const onSubmit = async (data: FormulaFormValues) => {
    try {
      if (editingFormula) {
        await updateFormula({ ...editingFormula, ...data });
        toast({ title: 'Formula Diperbarui', description: `Formula "${data.mutuBeton}" telah diperbarui.` });
      } else {
        await addFormula(data);
        toast({ title: 'Formula Ditambahkan', description: `Formula "${data.mutuBeton}" telah ditambahkan.` });
      }
      setEditingFormula(null);
      form.reset();
      await fetchFormulas();
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Gagal menyimpan formula.' });
    }
  };

  const handleEdit = (formula: JobMixFormula) => {
    setEditingFormula(formula);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingFormula(null);
    form.reset();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFormula(id);
      toast({ variant: 'destructive', title: 'Formula Dihapus', description: 'Formula telah dihapus.' });
      await fetchFormulas();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus formula.' });
    }
  };

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const handlePasswordCheck = (e: React.FormEvent) => {
      e.preventDefault();
      if (passwordInput === 'admin') {
          setIsAuthorized(true);
      } else {
          toast({ variant: 'destructive', title: 'Password Salah', description: 'Anda tidak memiliki izin untuk mengakses halaman ini.' });
          setPasswordInput('');
      }
  };

  if (!isAuthorized) {
    return (
        <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent hideCloseButton>
                <DialogHeader>
                    <DialogTitle>Akses Terbatas</DialogTitle>
                    <DialogDescription>
                        Halaman ini memerlukan otorisasi. Silakan masukkan password untuk melanjutkan.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePasswordCheck} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Password Akses</Label>
                        <Input 
                            id="password" 
                            type="password" 
                            value={passwordInput} 
                            onChange={(e) => setPasswordInput(e.target.value)} 
                            autoFocus
                        />
                    </div>
                    <Button type="submit" className="w-full">Masuk</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
              <CardTitle>Job Mix Formula</CardTitle>
              <CardDescription>
                {editingFormula ? `Editing formula: ${editingFormula.mutuBeton}` : 'Add a new job mix formula or edit an existing one.'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                    <Link href="/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke Dashboard
                    </Link>
                </Button>
                <Button onClick={saveMaterialLabels}>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Nama Material
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-4 items-end">
                <div className="col-span-3 lg:col-span-2 grid grid-cols-3 gap-2">
                    <FormField name="mutuBeton" control={form.control} render={({ field }) => (
                    <FormItem className="col-span-2">
                        <FormLabel>Mutu Beton</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g., K225" style={{ textTransform: 'uppercase' }} onChange={(e) => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )} />
                    <FormField name="mutuCode" control={form.control} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Kode</FormLabel>
                            <FormControl>
                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                    <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                                    <SelectContent>
                                        {mutuCodeOptions.map(code => <SelectItem key={code} value={code}>{code}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                             <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <FormField name="pasir1" control={form.control} render={({ field }) => (
                <FormItem>
                    <FormLabel><EditableLabel labelKey="pasir1" value={materialLabels.pasir1} onChange={handleLabelChange} /></FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField name="pasir2" control={form.control} render={({ field }) => (
                <FormItem>
                    <FormLabel><EditableLabel labelKey="pasir2" value={materialLabels.pasir2} onChange={handleLabelChange} /></FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField name="batu1" control={form.control} render={({ field }) => (
                <FormItem>
                    <FormLabel><EditableLabel labelKey="batu1" value={materialLabels.batu1} onChange={handleLabelChange} /></FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField name="batu2" control={form.control} render={({ field }) => (
                <FormItem>
                    <FormLabel><EditableLabel labelKey="batu2" value={materialLabels.batu2} onChange={handleLabelChange} /></FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField name="batu3" control={form.control} render={({ field }) => (
                <FormItem>
                    <FormLabel><EditableLabel labelKey="batu3" value={materialLabels.batu3} onChange={handleLabelChange} /></FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField name="batu4" control={form.control} render={({ field }) => (
                <FormItem>
                    <FormLabel><EditableLabel labelKey="batu4" value={materialLabels.batu4} onChange={handleLabelChange} /></FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField name="semen" control={form.control} render={({ field }) => (
                <FormItem>
                    <FormLabel><EditableLabel labelKey="semen" value={materialLabels.semen} onChange={handleLabelChange} /></FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                 <FormField name="air" control={form.control} render={({ field }) => (
                <FormItem>
                    <FormLabel><EditableLabel labelKey="air" value={materialLabels.air} onChange={handleLabelChange} /></FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField name="additive1" control={form.control} render={({ field }) => (
                <FormItem>
                    <FormLabel><EditableLabel labelKey="additive1" value={materialLabels.additive1} onChange={handleLabelChange} /></FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField name="additive2" control={form.control} render={({ field }) => (
                <FormItem>
                    <FormLabel><EditableLabel labelKey="additive2" value={materialLabels.additive2} onChange={handleLabelChange} /></FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField name="additive3" control={form.control} render={({ field }) => (
                <FormItem>
                    <FormLabel><EditableLabel labelKey="additive3" value={materialLabels.additive3} onChange={handleLabelChange} /></FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
            </div>

            <div className="flex justify-end gap-2">
              {editingFormula && <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>}
              <Button type="submit">
                {editingFormula ? <Edit className="mr-2" /> : <PlusCircle className="mr-2" />}
                {editingFormula ? 'Update Formula' : 'Add Formula'}
              </Button>
            </div>
          </form>
        </Form>
        
        {isLoading ? <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mutu Beton</TableHead>
                  <TableHead>{materialLabels.pasir1} (Kg)</TableHead>
                  <TableHead>{materialLabels.pasir2} (Kg)</TableHead>
                  <TableHead>{materialLabels.batu1} (Kg)</TableHead>
                  <TableHead>{materialLabels.batu2} (Kg)</TableHead>
                  <TableHead>{materialLabels.batu3} (Kg)</TableHead>
                  <TableHead>{materialLabels.batu4} (Kg)</TableHead>
                  <TableHead>{materialLabels.semen} (Kg)</TableHead>
                  <TableHead>{materialLabels.air} (Kg)</TableHead>
                  <TableHead>{materialLabels.additive1} (Kg)</TableHead>
                  <TableHead>{materialLabels.additive2} (Kg)</TableHead>
                  <TableHead>{materialLabels.additive3} (Kg)</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formulas.map((formula) => (
                  <TableRow key={formula.id}>
                    <TableCell className="font-medium">
                      {formula.mutuCode ? `${formula.mutuBeton} ${formula.mutuCode}` : formula.mutuBeton}
                    </TableCell>
                    <TableCell>{formula.pasir1}</TableCell>
                    <TableCell>{formula.pasir2}</TableCell>
                    <TableCell>{formula.batu1}</TableCell>
                    <TableCell>{formula.batu2}</TableCell>
                    <TableCell>{formula.batu3 || 0}</TableCell>
                    <TableCell>{formula.batu4 || 0}</TableCell>
                    <TableCell>{formula.semen}</TableCell>
                    <TableCell>{formula.air}</TableCell>
                    <TableCell>{formula.additive1 || 0}</TableCell>
                    <TableCell>{formula.additive2 || 0}</TableCell>
                    <TableCell>{formula.additive3 || 0}</TableCell>
                    <TableCell className="text-center space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(formula)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the formula for <span className="font-semibold">{formula.mutuBeton}</span>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete(formula.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FormulaManagerPage;
