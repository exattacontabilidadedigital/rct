"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useCalendar } from "@/calendar/contexts/calendar-context";
import type { CalendarEvent } from "@/calendar/interfaces";
import { getEventColorStyles } from "@/calendar/colors";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SingleDayPicker } from "@/components/ui/single-day-picker";
import { cn } from "@/lib/utils";
import type { EventColor } from "@/calendar/types";

import type { ReactNode } from "react";

const COLOR_OPTIONS = ["green", "orange", "red"] as const satisfies readonly EventColor[];

const schema = z
  .object({
    title: z.string().min(3, "Insira um título"),
    description: z.string().optional(),
    date: z.date({ required_error: "Escolha uma data" }),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    color: z.enum(COLOR_OPTIONS),
    userId: z.string(),
  })
  .refine(data => data.endTime > data.startTime, {
    message: "O término deve ser após o início",
    path: ["endTime"],
  });

type FormValues = z.infer<typeof schema>;

interface AddEventDialogProps {
  children: ReactNode;
}

function buildEventPayload(values: FormValues, user: CalendarEvent["user"]): CalendarEvent {
  const [startHour, startMinute] = values.startTime.split(":").map(Number);
  const [endHour, endMinute] = values.endTime.split(":").map(Number);

  const startDate = new Date(values.date);
  startDate.setHours(startHour, startMinute, 0, 0);

  const endDate = new Date(values.date);
  endDate.setHours(endHour, endMinute, 0, 0);

  return {
    id: crypto.randomUUID(),
    title: values.title,
    description: values.description,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    color: values.color as EventColor,
    user,
  } satisfies CalendarEvent;
}

export function AddEventDialog({ children }: AddEventDialogProps) {
  const { selectedDate, createEvent, users } = useCalendar();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      date: selectedDate,
      startTime: "09:00",
      endTime: "10:00",
      color: "orange",
      userId: users[0]?.id ?? "sem-responsavel",
    },
  });

  useEffect(() => {
    if (open) {
      form.setValue("date", selectedDate);
    }
  }, [form, open, selectedDate]);

  const handleSubmit = async (data: FormValues) => {
    const user = users.find(item => item.id === data.userId) ?? {
      id: "sem-responsavel",
      name: "Sem responsável",
    };

  const payload = buildEventPayload(data, user);
    await createEvent(payload);
    setOpen(false);
    form.reset({
      title: "",
      description: "",
      date: selectedDate,
      startTime: data.startTime,
      endTime: data.endTime,
      color: data.color,
      userId: data.userId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nova tarefa no calendário</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição curta da tarefa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <SingleDayPicker
                        mode="single"
                        selected={field.value}
                        onSelect={date => field.onChange(date ?? selectedDate)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Início</FormLabel>
                      <FormControl>
                        <Input type="time" step="900" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Término</FormLabel>
                      <FormControl>
                        <Input type="time" step="900" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COLOR_OPTIONS.map(color => {
                            const styles = getEventColorStyles(color);
                            return (
                              <SelectItem key={color} value={color}>
                                <div className="flex items-center gap-2">
                                  <span className={cn("size-2.5 rounded-full", styles.dot)} aria-hidden />
                                  <span className="capitalize">{color}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Detalhes adicionais" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Adicionar tarefa</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
