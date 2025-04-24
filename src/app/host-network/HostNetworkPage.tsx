"use client";

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wifi, MapPin, DollarSign, Key, Info, Upload } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Form,
  FormItem,
  FormLabel,
  FormField,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/app/components/ui/form";
import { toast } from "@/hooks/use-toast";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Image from "next/image";
import Layout from "../components/layout/Layout";
import CryptoJS from "crypto-js";
import {
  contract_Abi,
  contractAddress,
  loadContract,
  uploadImageToIPFS,
  uploadToIPFS,
} from "@/app/components/web3/contants";
import DashboardDirect from "@/app/components/DashboardDirect";

// Zod schema for form validation
const hostSchema = z.object({
  ssid: z.string().min(3, "Network name is required"),
  password: z.string().min(3, "Password is required"),
  location: z.object({
    country: z.string().min(1, "Country is required"),
    city: z.string().min(1, "City is required"),
    area: z.string().min(1, "Area is required"),
    lat: z.number().min(-90).max(90, "Invalid latitude"),
    lng: z.number().min(-180).max(180, "Invalid longitude"),
  }),
  speed: z.coerce.number().min(1, "Minimum 1 Mbps"),
  price: z.coerce.number().min(0.002, "Set at least 0.1 USDT"),
  description: z.string().max(500, "Description too long").optional(),
  image: z
    .instanceof(File)
    .refine((file) => file.size < 2 * 1024 * 1024, "Image must be under 2MB")
    .optional(),
});

type HostForm = z.infer<typeof hostSchema>;

export default function HostNetworkPage() {
  const [submitted, setSubmitted] = useState(false);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const form = useForm<HostForm>({
    resolver: zodResolver(hostSchema),
    mode: "onTouched",
    defaultValues: {
      ssid: "",
      password: "",
      location: { country: "", city: "", area: "", lat: 5.6037, lng: -0.187 },
      speed: 25,
      price: 0.002,
      description: "",
      image: undefined,
    },
  });
  const [roleType, setRoleType] = useState("guest");

  // Initialize Leaflet map
  useEffect(() => {
    const map = L.map("host-map").setView([5.6037, -0.187], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const marker = L.marker([5.6037, -0.187]).addTo(map);
    map.on("click", async (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      form.setValue("location.lat", lat);
      form.setValue("location.lng", lng);

      // Reverse geocoding with Nominatim
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await response.json();
        form.setValue("location.city", data.address.city || "Unknown");
        form.setValue("location.country", data.address.country || "Unknown");
        form.setValue("location.area", data.address.suburb || "Unknown");
      } catch (error) {
        console.error("Geocoding error:", error);
        toast({
          title: "Error",
          description:
            "Failed to fetch location details. Please enter manually.",
          variant: "destructive",
        });
      }
    });

    return () => {
      map.remove();
    };
  }, [form]);

  // Load Ethereum contract
  useEffect(() => {
    async function initializeContract() {
      const contractInstance = await loadContract({
        contractAddress,
        contractABI: contract_Abi,
      });
      if (contractInstance) {
        setContract(contractInstance);
      } else {
        console.error("Failed to load contract");
      }
    }
    initializeContract();
  }, []);

 // Form submission handler
async function onSubmit() {
  try {
    if (!contract) {
      toast({
        title: "Error",
        description: "Blockchain contract not loaded. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Upload image to IPFS if provided
    let imageCID = "";
    const imageFile = form.getValues().image;
    if (imageFile) {
      imageCID = await uploadImageToIPFS(imageFile);
    }

    // Make sure some values are set
    if (
      !form.getValues().location.city ||
      !form.getValues().location.country ||
      !form.getValues().location.area ||
      !form.getValues().location.lat ||
      !form.getValues().location.lng
    ) {
      toast({
        title: "Error",
        description: "Please select a valid location on the map.",
        variant: "destructive",
      });
      return;
    }

    // Encrypt password
    const secretKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY!;
    const password = form.getValues().password;
    const encryptedPassword = CryptoJS.AES.encrypt(password, secretKey).toString();

    // Upload encrypted password to IPFS
    const passwordCID = await uploadToIPFS(encryptedPassword);
    if (!passwordCID.match(/^(Qm[1-9A-Za-z]{44}|bafy[0-9a-z]{50})$/)) {
      throw new Error('Invalid IPFS CID for password');
    }

    // Send transaction to hostANetwork
    const tx = await contract?.hostANetwork(
      form.getValues().ssid,
      passwordCID, // Use CID, not encryptedPassword
      form.getValues().location.city,
      form.getValues().location.country,
      form.getValues().location.area,
      form.getValues().location.lat.toString(),
      form.getValues().location.lng.toString(),
      form.getValues().speed.toString(),
      ethers.parseUnits(form.getValues().price.toString(), 18), // Assuming USDT with 18 decimals
      form.getValues().description || "",
      imageCID || ""
    );

    // Wait for transaction confirmation
    await tx.wait();

    // Show success message and update UI
    toast({
      title: "Network Listed!",
      description: "Your WiFi network is now hosted and available to users.",
    });
    setSubmitted(true);
    setRoleType("host");
  } catch (error: unknown) {
    if (error instanceof Error) {
    toast({
      title: "Error",
      description: error instanceof Error && error.message.includes('Invalid IPFS CID')
        ? 'Failed to upload password to IPFS.'
        : 'Failed to list your network. Please try again.',
      variant: "destructive",
    });
    };
  }
}

  // Render summary after successful submission
  function renderSummary(data: HostForm) {
    if (!data) return null;
    return (
      <div className="mt-8 border border-zaanet-purple-light bg-white rounded-lg px-6 py-8 shadow animate-fade-in">
        <h2 className="text-2xl font-bold text-zaanet-purple flex items-center gap-2 mb-2">
          <Wifi className="text-zaanet-purple" /> Your Hosted Network
        </h2>
        <div className="mb-4 text-gray-600">
          <span className="font-semibold">{data.ssid}</span> in{" "}
          <span className="text-zaanet-purple">
            {data.location.city}, {data.location.area}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 my-4 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="text-zaanet-purple" size={18} />
            <span>
              <span className="font-bold">{data.price}</span> USDT/day
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="text-zaanet-purple" size={18} />
            <span>
              {data.location.city}, {data.location.area}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="text-zaanet-purple" size={18} />
            <span>{data.speed} Mbps</span>
          </div>
          <div className="flex items-center gap-2">
            <Key className="text-zaanet-purple" size={18} />
            <span>
              {data.password
                .split("")
                .map(() => "•")
                .join("")}
            </span>
          </div>
        </div>
        {data.description && (
          <div className="text-gray-500 mt-2">
            <Info size={18} className="inline mr-1" />
            {data.description}
          </div>
        )}
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container max-w-2xl py-12 px-4 mx-auto flex flex-col items-center">
        <div className="bg-zaanet-purple/10 rounded-full p-6 mb-4 animate-scale-in">
          <Wifi size={48} className="text-zaanet-purple" />
        </div>
        <h1 className="text-3xl font-bold text-zaanet-purple mb-3">
          Network Successfully Hosted!
        </h1>
        <p className="text-gray-700 mb-6 text-center">
          Congratulations! Your network is now discoverable by nearby users and
          you&apos;ll start earning for every connection. You can manage or
          update your network from your dashboard.
        </p>
        <DashboardDirect roleType={roleType} />

        {renderSummary(form.getValues())}
        <Button
          className="mt-8 bg-zaanet-purple hover:bg-zaanet-purple-dark text-white"
          onClick={() => setSubmitted(false)}
        >
          Host Another Network
        </Button>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container max-w-2xl py-12 px-4 mx-auto">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-zaanet-purple/10 rounded-full p-6 animate-scale-in">
            <Upload size={42} className="text-zaanet-purple" />
          </div>
          <h1 className="text-3xl font-bold text-zaanet-purple mb-2 font-heading">
            Become a Host
          </h1>
          <p className="text-gray-700 text-center max-w-xl mb-3">
            Share your WiFi and earn passive income in USDT. Contribute to
            affordable, accessible internet for your community! <br />
            <span className="text-zaanet-purple-dark">
              It’s easy, instant, and secure.
            </span>
          </p>
        </div>
        <div className="bg-white border border-zaanet-purple-light rounded-xl p-8 shadow-lg mb-8 animate-fade-in">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="ssid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Wifi className="inline -mt-1 mr-1 text-zaanet-purple" />{" "}
                      Network Name (SSID)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="E.g. ZaaNet Home"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Pick a friendly name for your WiFi.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Key className="inline -mt-1 mr-1 text-zaanet-purple" />{" "}
                      WiFi Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter WiFi password"
                        autoComplete="off"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Required for secure user access. Your password is
                      encrypted before being stored.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>
                  <MapPin className="inline -mt-1 mr-1 text-zaanet-purple" />{" "}
                  Location
                </FormLabel>
                <div
                  id="host-map"
                  className="h-64 w-full rounded-lg border border-gray-300"
                />
                <FormDescription>
                  Click on the map to set your network’s location.
                </FormDescription>
              </FormItem>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="location.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Ghana" required {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Accra" required {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location.area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Osu" required {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="speed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Wifi className="inline -mt-1 mr-1 text-zaanet-purple" />{" "}
                        WiFi Speed (Mbps)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          placeholder="e.g. 25"
                          required
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Your internet package speed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <DollarSign className="inline -mt-1 mr-1 text-zaanet-purple" />{" "}
                        Price (USDT/day)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0.002}
                          step={0.002}
                          placeholder="e.g. 0.02"
                          required
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Users pay this to connect for a day.
                      </FormDescription>
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
                    <FormLabel>
                      <Info className="inline -mt-1 mr-1 text-zaanet-purple" />{" "}
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Any special info or house rules? (optional)"
                        maxLength={400}
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      E.g. “Available 24/7, please use respectfully.”
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="image"
                render={({ field: { onChange } }) => (
                  <FormItem>
                    <FormLabel>
                      <Upload className="inline -mt-1 mr-1 text-zaanet-purple" />{" "}
                      Add a Photo
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onChange(e.target.files?.[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      (Optional) Show where users should connect from.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-zaanet-purple hover:bg-zaanet-purple-dark text-white mt-2 font-semibold"
                size="lg"
              >
                List My Network
              </Button>
            </form>
          </Form>
          <div className="flex gap-4 mt-8">
            <div className="bg-zaanet-green rounded-lg px-4 py-3 text-sm text-zaanet-purple-dark flex-1 shadow">
              <span className="font-bold">Tip:</span> Your exact address is not
              shown publicly—only a general location for privacy.
            </div>
            <div className="bg-zaanet-blue rounded-lg px-4 py-3 text-sm text-zaanet-purple-dark flex-1 shadow hidden sm:block">
              <span className="font-bold">Need help?</span> See our{" "}
              <a href="#" className="underline text-zaanet-purple">
                hosting guide
              </a>
              .
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-8 mt-14 justify-center">
          <div>
            <h2 className="text-xl font-semibold text-zaanet-purple mb-2">
              Why Host on ZaaNet?
            </h2>
            <ul className="text-gray-700 list-disc ml-5 space-y-1">
              <li>
                Earn effortless crypto income—get paid instantly for every
                connection.
              </li>
              <li>
                Empower your community with affordable, reliable internet.
              </li>
              <li>
                Full control—pause/unpause, set your own price, and see your
                earnings.
              </li>
              <li>We handle seamless secure payments and network access.</li>
            </ul>
          </div>
          <Image
            src="/placeholder.svg"
            alt="Community illustration"
            width={160}
            height={160}
            className="w-40 h-40 object-contain mx-auto animate-blob"
          />
        </div>
      </div>
    </Layout>
  );
}
