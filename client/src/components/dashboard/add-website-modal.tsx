import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertWebsiteSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { X, Loader2 } from "lucide-react";
import { z } from "zod";

interface AddWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = insertWebsiteSchema.extend({
  url: z.string().url("Please enter a valid URL"),
  name: z.string().min(1, "Website name is required"),
});

type FormData = z.infer<typeof formSchema>;

export function AddWebsiteModal({ isOpen, onClose }: AddWebsiteModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      url: "",
      checkInterval: 5,
      enableNotifications: true,
    },
  });

  const createWebsiteMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/websites", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
      toast({
        title: "Success",
        description: "Website added successfully",
      });
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add website",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createWebsiteMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-add-website">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Add New Website</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Website Name</Label>
            <Input
              id="name"
              placeholder="My Website"
              {...register("name")}
              data-testid="input-website-name"
            />
            {errors.name && (
              <p
                className="text-sm text-destructive"
                data-testid="error-website-name"
              >
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              {...register("url")}
              data-testid="input-website-url"
            />
            {errors.url && (
              <p
                className="text-sm text-destructive"
                data-testid="error-website-url"
              >
                {errors.url.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Check Interval</Label>
            <Select
              value={watch("checkInterval")?.toString()}
              onValueChange={(value) =>
                setValue("checkInterval", parseInt(value))
              }
            >
              <SelectTrigger data-testid="select-check-interval">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Every 1 minute</SelectItem>
                <SelectItem value="5">Every 5 minutes</SelectItem>
                <SelectItem value="10">Every 10 minutes</SelectItem>
                <SelectItem value="30">Every 30 minutes</SelectItem>
                <SelectItem value="60">Every 1 hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableNotifications"
              checked={watch("enableNotifications")}
              onCheckedChange={(checked) =>
                setValue("enableNotifications", checked as boolean)
              }
              data-testid="checkbox-enable-notifications"
            />
            <Label htmlFor="enableNotifications" className="text-sm">
              Enable email notifications
            </Label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createWebsiteMutation.isPending}
              data-testid="button-submit"
            >
              {createWebsiteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Website
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
