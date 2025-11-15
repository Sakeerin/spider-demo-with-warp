"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useParams } from "next/navigation";

const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const leadSchema = z.object({
  accountLead: z.string().optional(),
  contactDate: z.string().optional(),
  company: z.string().min(1, "Company is required"),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  mobilePhone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  channel: z.string().optional(),
  sales: z.string().min(1, "Sales representative is required"),
  jobStatus: z.string(),
  followUpDate: z.string().optional(),
  jobDetail: z.string().optional(),
  productType: z.string().min(1, "Product type is required"),
  adType: z.string().optional(),
  remark: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface SalesUser {
  id: string;
  name?: string;
  email: string;
}

export default function EditLeadPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
  });

  // Load lead data from API
  useEffect(() => {
    async function loadLead() {
      if (!id) return;

      try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
          router.push("/admin/login");
          return;
        }

        const res = await fetch(`${base}/api/admin/crm/leads/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }

        if (res.ok) {
          const lead = await res.json();

          // Map API data to form format
          const formData: LeadFormData = {
            accountLead: lead.accountNumber || "",
            contactDate: lead.contactAt ? new Date(lead.contactAt).toISOString().split('T')[0] : "",
            company: lead.company?.name || "",
            contactName: lead.contactName || "",
            contactPhone: lead.contactPhone || "",
            mobilePhone: lead.mobilePhone || "",
            email: lead.email || "",
            channel: lead.source || "",
            sales: lead.sales?.name || lead.sales?.email || "",
            jobStatus: lead.status || "First Contact",
            followUpDate: lead.followUpAt ? new Date(lead.followUpAt).toISOString().split('T')[0] : "",
            jobDetail: lead.detail || lead.description || "",
            productType: lead.productType || "",
            adType: lead.adType || "",
            remark: lead.remark || "",
          };

          reset(formData);
        } else {
          setError("Failed to load lead data");
        }
      } catch (err) {
        console.error("Failed to load lead:", err);
        setError("Failed to load lead data");
      } finally {
        setIsLoading(false);
      }
    }

    loadLead();
  }, [id, reset, router]);

  // Load sales users from API
  useEffect(() => {
    async function loadSalesUsers() {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
          router.push("/admin/login");
          return;
        }

        const res = await fetch(`${base}/api/admin/crm/leads/sales-users`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }

        if (res.ok) {
          const text = await res.text();
          const data = text ? JSON.parse(text) : { data: [] };
          setSalesUsers(data.data || []);
        }
      } catch (err) {
        console.error("Failed to load sales users:", err);
      } finally {
        setLoadingSales(false);
      }
    }

    loadSalesUsers();
  }, [router]);

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        router.push("/admin/login");
        return;
      }

      // Map sales name to ID
      const salesUser = salesUsers.find(s => (s.name || s.email) === data.sales);
      const salesId = salesUser?.id || null;

      // Map form data to API format (PATCH endpoint expects partial updates)
      const payload = {
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        mobilePhone: data.mobilePhone,
        email: data.email || undefined,
        contactAt: data.contactDate || undefined,
        source: data.channel || data.adType,
        salesId: salesId,
        status: data.jobStatus,
        followUpAt: data.followUpDate || undefined,
        detail: data.jobDetail,
        productType: data.productType,
        adType: data.adType,
        remark: data.remark,
      };

      const res = await fetch(`${base}/api/admin/crm/leads/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // Handle authentication errors
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      // Handle other HTTP errors
      if (!res.ok) {
        const errorText = await res.text();
        let errorData;
        try {
          errorData = errorText ? JSON.parse(errorText) : {};
        } catch {
          errorData = {};
        }
        throw new Error(errorData.message || `Failed to update lead: ${res.statusText}`);
      }

      setSuccess("Lead updated successfully!");

      // Redirect after a short delay to show success message
      setTimeout(() => {
        const leadId = String(id);
        // Basic validation to prevent path traversal
        if (/^[a-zA-Z0-9-_]+$/.test(leadId)) {
          router.push(`/leads/${leadId}`);
        } else {
          router.push('/leads');
        }
      }, 1500);
    } catch (err) {
      console.error("Error updating lead:", err);
      setError(err instanceof Error ? err.message : "Failed to update lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-yellow-400 p-4 mb-8">
          <h1 className="text-2xl font-bold">Edit Account-Lead</h1>
        </div>
        <div className="text-center py-8">Loading lead data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="bg-yellow-400 p-4 mb-8">
        <h1 className="text-2xl font-bold">Edit Account-Lead</h1>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p className="font-semibold">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Customer Details */}
        <div className="p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input type="text" {...register("accountLead")} placeholder="Account Lead" className="p-2 border rounded w-full" />
            </div>
            <div>
              <input type="date" {...register("contactDate")} className="p-2 border rounded w-full" />
            </div>
            <div>
              <input type="text" {...register("company")} placeholder="* Company" className="p-2 border rounded w-full" />
              {errors.company && <p className="text-red-500 text-sm">{errors.company.message}</p>}
            </div>
            <div>
              <input type="text" {...register("contactName")} placeholder="Contact Name" className="p-2 border rounded w-full" />
            </div>
            <div>
              <input type="text" {...register("contactPhone")} placeholder="Contact Phone" className="p-2 border rounded w-full" />
            </div>
            <div>
              <input type="text" {...register("mobilePhone")} placeholder="Mobile Phone" className="p-2 border rounded w-full" />
            </div>
            <div>
              <input type="email" {...register("email")} placeholder="E-mail" className="p-2 border rounded w-full" />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>
            <div>
              <input type="text" {...register("channel")} placeholder="Channel" className="p-2 border rounded w-full" />
            </div>
          </div>
        </div>

        {/* Sales Details */}
        <div className="p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-4">Sales Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <select {...register("sales")} className="p-2 border rounded w-full" disabled={loadingSales}>
                <option value="">
                  {loadingSales ? "Loading sales reps..." : "* Select Sales Rep"}
                </option>
                {salesUsers.map((user) => (
                  <option key={user.id} value={user.name || user.email}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
              {errors.sales && <p className="text-red-500 text-sm">{errors.sales.message}</p>}
            </div>
            <div>
              <select {...register("jobStatus")} className="p-2 border rounded w-full">
                <option value="First Contact">First Contact</option>
                <option value="Follow Up">Follow Up</option>
                <option value="Negotiating">Negotiating</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
            <div>
              <input type="date" {...register("followUpDate")} className="p-2 border rounded w-full" />
            </div>
            <div className="md:col-span-2">
              <textarea {...register("jobDetail")} placeholder="Job Detail" className="p-2 border rounded w-full"></textarea>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-4">Product Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <select {...register("productType")} className="p-2 border rounded w-full">
                <option value="">* Select Product Type</option>
                <option value="Solar Panel">Solar Panel</option>
                <option value="EV Charger">EV Charger</option>
                <option value="Smart Home Automation">Smart Home Automation</option>
                <option value="General Construction">General Construction</option>
              </select>
              {errors.productType && <p className="text-red-500 text-sm">{errors.productType.message}</p>}
            </div>
            <div>
              <select {...register("adType")} className="p-2 border rounded w-full">
                <option value="">Select Ad-Type</option>
                <option value="Facebook Ads">Facebook Ads</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Referral">Referral</option>
                <option value="Walk-in">Walk-in</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <textarea {...register("remark")} placeholder="Remark" className="p-2 border rounded w-full"></textarea>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => router.back()} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded" disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}