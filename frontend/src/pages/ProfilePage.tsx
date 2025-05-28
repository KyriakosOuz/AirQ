
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { userApi } from "@/lib/api";
import { useUserStore } from "@/stores/userStore";
import { toast } from "sonner";
import { UserProfile } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const profileFormSchema = z.object({
  age: z.number().min(1).max(120).optional().nullable(),
  has_asthma: z.boolean().optional(),
  is_smoker: z.boolean().optional(),
  has_heart_disease: z.boolean().optional(),
  has_diabetes: z.boolean().optional(),
  has_lung_disease: z.boolean().optional(),
  accept_terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions to save your health profile",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfilePage: React.FC = () => {
  const user = useUserStore(state => state.user);
  const profile = useUserStore(state => state.profile);
  const updateProfile = useUserStore(state => state.updateProfile);
  
  const [saving, setSaving] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      age: profile?.age || undefined,
      has_asthma: profile?.has_asthma || false,
      is_smoker: profile?.is_smoker || false,
      has_heart_disease: profile?.has_heart_disease || false,
      has_diabetes: profile?.has_diabetes || false,
      has_lung_disease: profile?.has_lung_disease || false,
      accept_terms: false,
    },
  });
  
  // Update form when profile is loaded/changed
  useEffect(() => {
    if (profile) {
      form.reset({
        age: profile.age || undefined,
        has_asthma: profile.has_asthma || false,
        is_smoker: profile.is_smoker || false, 
        has_heart_disease: profile.has_heart_disease || false,
        has_diabetes: profile.has_diabetes || false,
        has_lung_disease: profile.has_lung_disease || false,
        accept_terms: false, // Always reset to false for new saves
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    setSaving(true);
    try {
      // Clean up the data for submission (exclude accept_terms from API call)
      const profileData = {
        age: data.age || null,
        has_asthma: data.has_asthma || false,
        is_smoker: data.is_smoker || false,
        has_heart_disease: data.has_heart_disease || false,
        has_diabetes: data.has_diabetes || false,
        has_lung_disease: data.has_lung_disease || false,
      };
      
      // Save to API
      const response = await userApi.saveProfile(profileData);
      
      if (response.success) {
        // Update local state with complete profile
        if (profile) {
          const updatedProfile: UserProfile = {
            ...profile,
            ...profileData,
          };
          updateProfile(updatedProfile);
          toast.success("Profile saved successfully");
          // Reset the terms acceptance after successful save
          form.setValue("accept_terms", false);
        } else {
          toast.error("Could not update profile: Profile not initialized");
        }
      } else {
        toast.error("Failed to save profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Something went wrong while saving your profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground">
          Add your health information to receive personalized air quality recommendations.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Information */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="font-medium">Email</div>
              <div className="text-muted-foreground">{user?.email || "Not available"}</div>
            </div>
          </CardContent>
        </Card>
        
        {/* Health Profile */}
        <Card className="md:col-span-1 lg:col-span-2 md:row-span-2">
          <CardHeader>
            <CardTitle>Health Information</CardTitle>
            <CardDescription>
              This information helps us provide you with personalized air quality recommendations.
              Your data is kept private and secure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={120}
                            placeholder="Your age"
                            {...field}
                            value={field.value || ''}
                            onChange={event => field.onChange(event.target.value === '' ? undefined : Number(event.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Your age helps determine your risk factors.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="has_asthma"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0">
                            <FormLabel>Asthma</FormLabel>
                            <FormDescription>
                              Do you have asthma?
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="is_smoker"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0">
                            <FormLabel>Smoker</FormLabel>
                            <FormDescription>
                              Are you a smoker?
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="has_heart_disease"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0">
                            <FormLabel>Heart Disease</FormLabel>
                            <FormDescription>
                              Do you have heart disease?
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="has_diabetes"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0">
                            <FormLabel>Diabetes</FormLabel>
                            <FormDescription>
                              Do you have diabetes?
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="has_lung_disease"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0">
                            <FormLabel>Lung Disease</FormLabel>
                            <FormDescription>
                              Do you have any lung diseases?
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Terms & Conditions Acceptance */}
                <div className="border-t pt-6">
                  <FormField
                    control={form.control}
                    name="accept_terms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium">
                            I accept the terms and conditions
                          </FormLabel>
                          <FormDescription className="text-sm text-muted-foreground">
                            By checking this box, you agree that your health data will be stored securely 
                            and used only to provide personalized air quality recommendations. We will never 
                            share your personal health information with third parties or use it for any other 
                            purpose without your explicit consent.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Health Profile"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Privacy Information */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Privacy Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your health data is used only to personalize air quality recommendations. 
              We never share your personal information with third parties.
              You can delete your profile data at any time from this page.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
