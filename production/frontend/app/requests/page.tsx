
"use client";

import { useEffect, useState } from "react";

type MaterialRequirement = {
  PM_ID: number;
  IM_ID: number;
  SKU: string;
  Item_Name: string;
  unit_of_measure: string;
  MaterialRequired: number;
};

export default function RequestsPage() {
  const [activeFunction, setActiveFunction] = useState("material-requirement");

  // Selected product: 1 = Gaming PC, 4 = Office PC
  const [selectedPM, setSelectedPM] = useState(1);

  const [materials, setMaterials] = useState<MaterialRequirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (activeFunction !== "material-requirement") {
      return;
    }

    const fetchMaterialRequirements = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/requests/material-requirements/?pm_id=${selectedPM}`
        );

        if (!response.ok) {
          throw new Error("Failed to retrieve material requirements.");
        }

        const data: MaterialRequirement[] = await response.json();
        setMaterials(data);
      } catch (error) {
        console.error(error);
        setError("Unable to load material requirements.");
      } finally {
        setLoading(false);
      }
    };

    fetchMaterialRequirements();
  }, [activeFunction, selectedPM, refreshKey]);

  return (
    <div className="p-8 space-y-6">

      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Requests
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Manage production-related requests and material operations.
        </p>
      </div>

      {/* FUNCTION SELECTOR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <button
          onClick={() => setActiveFunction("material-requirement")}
          className={`text-left p-5 rounded-xl border transition ${
            activeFunction === "material-requirement"
              ? "border-[#365f68] bg-[#eaf2f2]"
              : "border-gray-200 bg-white hover:bg-gray-50"
          }`}
        >
          <h2 className="font-semibold text-gray-800">
            Material Requirement
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            View the raw materials required for each product.
          </p>
        </button>

        <button
          onClick={() => setActiveFunction("material-issuance")}
          className={`text-left p-5 rounded-xl border transition ${
            activeFunction === "material-issuance"
              ? "border-[#365f68] bg-[#eaf2f2]"
              : "border-gray-200 bg-white hover:bg-gray-50"
          }`}
        >
          <h2 className="font-semibold text-gray-800">
            Material Issuance
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            Manage the release of raw materials to Production.
          </p>
        </button>

      </div>

      {/* DYNAMIC CONTENT */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">

        {activeFunction === "material-requirement" && (
          <>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-5">

              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Material Requirements
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  View the Bill of Materials for the selected product.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedPM}
                  onChange={(event) => setSelectedPM(Number(event.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700"
                >
                  <option value={1}>Gaming PC</option>
                  <option value={4}>Office PC</option>
                </select>

                <button
                  onClick={() => setRefreshKey((current) => current + 1)}
                  className="px-4 py-2 text-sm rounded-lg bg-[#365f68] text-white hover:bg-[#294b53]"
                >
                  Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-gray-500 py-6 text-center">
                Loading material requirements...
              </p>
            ) : error ? (
              <p className="text-red-500 py-6 text-center">
                {error}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">

                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="p-3">Material SKU</th>
                      <th className="p-3">Material Name</th>
                      <th className="p-3">Quantity per Product</th>
                      <th className="p-3">Unit</th>
                    </tr>
                  </thead>

                  <tbody>
                    {materials.length > 0 ? (
                      materials.map((material) => (
                        <tr
                          key={material.IM_ID}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="p-3">
                            {material.SKU}
                          </td>

                          <td className="p-3">
                            {material.Item_Name}
                          </td>

                          <td className="p-3 font-semibold">
                            {material.MaterialRequired}
                          </td>

                          <td className="p-3">
                            {material.unit_of_measure}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-8 text-center text-gray-500"
                        >
                          No material requirements found for this product.
                        </td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>
            )}
          </>
        )}

        {activeFunction === "material-issuance" && (
          <div className="py-12 text-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Material Issuance
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              This function is awaiting its backend integration.
            </p>
          </div>
        )}

      </div>

    </div>
  );
}