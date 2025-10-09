"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";

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

export default function CreateLeadPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      jobStatus: "First Contact",
    },
  });

  const onSubmit = async (data) => {
    // TODO: Connect to API endpoint
    console.log("Form Data:", data);
    alert("Lead created successfully! (placeholder)");
    router.push("/leads");
  };

  return (
    <div className="container mx-auto p-8">
      <div className="bg-yellow-400 p-4 mb-8">
        <h1 className="text-2xl font-bold">Create Account-Lead</h1>
      </div>
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
              <select {...register("sales")} className="p-2 border rounded w-full">
                <option value="">* Select Sales Rep</option>
                <option value="Seksan Dujdevireoj">Seksan Dujdevireoj</option>
                <option value="Jane Doe">Jane Doe</option>
                <option value="John Smith">John Smith</option>
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
          <button type="button" onClick={() => router.back()} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
            Cancel
          </button>
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}