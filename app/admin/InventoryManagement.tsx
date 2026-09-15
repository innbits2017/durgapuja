"use client";

import { useEffect, useState } from "react";

type InventoryItem = {
  id: string;
  item_key: string;
  item_name: string;
  description: string | null;
  required_quantity: number;
  unit: string;
  icon: string | null;
  display_order: number;
  active: boolean;
};

type InventoryRequest = {
  id: string;
  request_no: string;
  inventory_item_id: string;
  name: string;
  block: string;
  flat_no: string;
  mobile: string;
  brand: string | null;
  quantity: number;
  status: string;
  admin_note: string | null;
  created_at: string;
  verified_at: string | null;
  inventory_items?: {
    item_name?: string;
    item_key?: string;
    unit?: string;
    icon?: string;
  };
};

export default function InventoryManagement() {
  const [items, setItems] =
    useState<InventoryItem[]>([]);

  const [requests, setRequests] =
    useState<InventoryRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [loadingId, setLoadingId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingItem, setEditingItem] =
    useState<InventoryItem | null>(
      null
    );

  const [itemName, setItemName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [requiredQuantity, setRequiredQuantity] =
    useState("");

  const [unit, setUnit] =
    useState("pieces");

  const [icon, setIcon] =
    useState("fa-box");

  async function loadData() {
    try {
      const response =
        await fetch(
          "/api/admin/inventory-help",
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to load inventory."
        );
      }

      setItems(
        data.items || []
      );

      setRequests(
        data.requests || []
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to load inventory data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    const interval =
      window.setInterval(
        loadData,
        10000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, []);

  function openAdd() {
    setEditingItem(null);
    setItemName("");
    setDescription("");
    setRequiredQuantity("");
    setUnit("pieces");
    setIcon("fa-box");
    setShowForm(true);
    setMessage("");
  }

  function openEdit(
    item: InventoryItem
  ) {
    setEditingItem(item);
    setItemName(item.item_name);
    setDescription(
      item.description || ""
    );
    setRequiredQuantity(
      String(item.required_quantity)
    );
    setUnit(item.unit);
    setIcon(
      item.icon || "fa-box"
    );
    setShowForm(true);
    setMessage("");
  }

  async function saveItem() {
    setMessage("");

    if (!itemName.trim()) {
      setMessage(
        "Item name is required."
      );
      return;
    }

    if (
      !Number.isInteger(
        Number(requiredQuantity)
      ) ||
      Number(requiredQuantity) < 0
    ) {
      setMessage(
        "Enter a valid required quantity."
      );
      return;
    }

    if (!unit.trim()) {
      setMessage(
        "Unit is required."
      );
      return;
    }

    setSaving(true);

    try {
      const response =
        await fetch(
          "/api/admin/inventory-help",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              id:
                editingItem?.id ||
                null,
              itemName:
                itemName.trim(),
              description:
                description.trim(),
              requiredQuantity:
                Number(
                  requiredQuantity
                ),
              unit:
                unit.trim(),
              icon:
                icon.trim() ||
                "fa-box",
              active: true,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data?.error ||
            "Unable to save inventory."
        );
        return;
      }

      setMessage(
        editingItem
          ? "Inventory updated successfully."
          : "Inventory added successfully."
      );

      setShowForm(false);

      await loadData();
    } catch {
      setMessage(
        "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(
    id: string
  ) {
    if (
      !window.confirm(
        "Remove this inventory item from the public page?"
      )
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          "/api/admin/inventory-help",
          {
            method: "DELETE",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              id,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data?.error ||
            "Unable to remove item."
        );
        return;
      }

      setMessage(
        "Inventory item removed."
      );

      await loadData();
    } catch {
      setMessage(
        "Something went wrong."
      );
    }
  }

  async function updateRequest(
    id: string,
    status:
      | "verified"
      | "rejected"
  ) {
    setLoadingId(id);
    setMessage("");

    try {
      const response =
        await fetch(
          "/api/admin/inventory-help/verify",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              id,
              status,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data?.error ||
            "Unable to update request."
        );
        return;
      }

      setMessage(
        status === "verified"
          ? "Inventory contribution verified successfully."
          : "Inventory request rejected."
      );

      await loadData();
    } catch {
      setMessage(
        "Something went wrong."
      );
    } finally {
      setLoadingId(null);
    }
  }

  function getReceived(
    itemId: string
  ) {
    return requests
      .filter(
        (request) =>
          request.inventory_item_id ===
            itemId &&
          request.status ===
            "verified"
      )
      .reduce(
        (sum, request) =>
          sum +
          Number(
            request.quantity || 0
          ),
        0
      );
  }

  if (loading) {
    return (
      <section className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-[#a70e18]" />

        <p className="mt-3 text-sm text-[#777]">
          Loading inventory...
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-5">

      {/* ======================================================
          INVENTORY MASTER
      ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-[#eadfd2] bg-white shadow-sm">

        <div className="flex flex-col gap-3 border-b border-[#eee5db] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="font-serif text-xl font-bold">
              Inventory Requirements
            </h2>

            <p className="mt-1 text-xs text-[#858585]">
              Add and manage items required for the Puja.
            </p>
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#a70e18] px-4 text-sm font-semibold text-white"
          >
            <i className="fa-solid fa-plus" />
            Add Inventory
          </button>

        </div>

        {message && (
          <div className="mx-4 mt-4 rounded-lg bg-[#fff8e7] px-4 py-3 text-xs text-[#765f53]">
            <i className="fa-solid fa-circle-info mr-2 text-[#a70e18]" />
            {message}
          </div>
        )}

        <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">

          {items.map(
            (item) => {
              const received =
                getReceived(
                  item.id
                );

              const remaining =
                Math.max(
                  item.required_quantity -
                    received,
                  0
                );

              const progress =
                item.required_quantity
                  ? Math.min(
                      100,
                      Math.round(
                        (received /
                          item.required_quantity) *
                          100
                      )
                    )
                  : 0;

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 ${
                    item.active
                      ? "border-[#eadfd2] bg-[#fffdf9]"
                      : "border-[#ddd] bg-[#f6f6f6] opacity-60"
                  }`}
                >

                  <div className="flex items-start gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f8e8e5] text-[#a70e18]">
                      <i
                        className={`fa-solid ${
                          item.icon ||
                          "fa-box"
                        }`}
                      />
                    </div>

                    <div className="flex-1">

                      <div className="flex justify-between gap-2">

                        <h3 className="text-sm font-bold">
                          {item.item_name}
                        </h3>

                        {!item.active && (
                          <span className="text-[9px] font-bold text-[#888]">
                            INACTIVE
                          </span>
                        )}

                      </div>

                      <p className="mt-1 text-[10px] text-[#777]">
                        {item.description}
                      </p>

                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-[#fcf7ed] p-3">

                    <div className="flex justify-between text-[11px]">
                      <span>
                        Required
                      </span>

                      <strong>
                        {
                          item.required_quantity
                        }{" "}
                        {item.unit}
                      </strong>
                    </div>

                    <div className="mt-1 flex justify-between text-[11px]">
                      <span>
                        Verified Received
                      </span>

                      <strong className="text-[#287638]">
                        {received}{" "}
                        {item.unit}
                      </strong>
                    </div>

                    <div className="mt-1 flex justify-between text-[11px]">
                      <span>
                        Remaining
                      </span>

                      <strong className="text-[#a70e18]">
                        {remaining}{" "}
                        {item.unit}
                      </strong>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eadfd2]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#a70e18] to-[#d09a32]"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        openEdit(item)
                      }
                      className="rounded-lg border border-[#ddd6cd] bg-white py-2 text-xs font-semibold text-[#555]"
                    >
                      <i className="fa-solid fa-pen mr-1" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        removeItem(
                          item.id
                        )
                      }
                      className="rounded-lg border border-[#f0cccc] bg-[#fff6f6] py-2 text-xs font-semibold text-[#a70e18]"
                    >
                      <i className="fa-solid fa-trash mr-1" />
                      Remove
                    </button>

                  </div>

                </div>
              );
            }
          )}

        </div>
      </section>

      {/* ======================================================
          REQUESTS
      ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-[#eadfd2] bg-white shadow-sm">

        <div className="border-b border-[#eee5db] px-4 py-4">

          <h2 className="font-serif text-xl font-bold">
            Inventory Help Requests
          </h2>

          <p className="mt-1 text-xs text-[#858585]">
            Verify or reject inventory contributions submitted by residents.
          </p>

        </div>

        <div className="divide-y divide-[#eee5db]">

          {requests.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#888]">
              No inventory help requests yet.
            </div>
          ) : (
            requests.map(
              (request) => (
                <div
                  key={request.id}
                  className="p-4"
                >

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f8e8e5] text-[#a70e18]">
                        <i
                          className={`fa-solid ${
                            request.inventory_items?.icon ||
                            "fa-box"
                          }`}
                        />
                      </div>

                      <div>

                        <div className="flex flex-wrap items-center gap-2">

                          <strong className="text-sm">
                            {
                              request.inventory_items
                                ?.item_name
                            }
                          </strong>

                          <span className="rounded-full bg-[#f5eee4] px-2 py-1 text-[9px] font-bold text-[#765f53]">
                            {
                              request.request_no
                            }
                          </span>

                          <span
                            className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${
                              request.status ===
                              "verified"
                                ? "bg-[#e7f4e9] text-[#287638]"
                                : request.status ===
                                    "rejected"
                                  ? "bg-[#fff0f0] text-[#a70e18]"
                                  : "bg-[#fff8e7] text-[#a56b00]"
                            }`}
                          >
                            {request.status}
                          </span>

                        </div>

                        <div className="mt-2 text-xs text-[#555]">
                          <strong>
                            {request.name}
                          </strong>
                          {" · "}
                          {request.block}-
                          {request.flat_no}
                          {" · "}
                          +91{" "}
                          {request.mobile}
                        </div>

                        <div className="mt-1 text-xs text-[#777]">
                          Quantity:{" "}
                          <strong>
                            {request.quantity}{" "}
                            {
                              request.inventory_items
                                ?.unit
                            }
                          </strong>

                          {request.brand && (
                            <>
                              {" · "}
                              Brand:{" "}
                              <strong>
                                {request.brand}
                              </strong>
                            </>
                          )}
                        </div>

                        <div className="mt-1 text-[10px] text-[#999]">
                          Submitted:{" "}
                          {new Date(
                            request.created_at
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </div>

                      </div>
                    </div>

                    {request.status ===
                      "pending" && (
                      <div className="flex gap-2">

                        <button
                          type="button"
                          disabled={
                            loadingId ===
                            request.id
                          }
                          onClick={() =>
                            updateRequest(
                              request.id,
                              "verified"
                            )
                          }
                          className="rounded-lg bg-[#23753b] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          <i className="fa-solid fa-check mr-1" />
                          Verify
                        </button>

                        <button
                          type="button"
                          disabled={
                            loadingId ===
                            request.id
                          }
                          onClick={() =>
                            updateRequest(
                              request.id,
                              "rejected"
                            )
                          }
                          className="rounded-lg border border-[#f0cccc] bg-[#fff6f6] px-4 py-2.5 text-xs font-semibold text-[#a70e18] disabled:opacity-50"
                        >
                          <i className="fa-solid fa-xmark mr-1" />
                          Reject
                        </button>

                      </div>
                    )}

                  </div>

                </div>
              )
            )
          )}

        </div>
      </section>

      {/* ======================================================
          ADD / EDIT MODAL
      ====================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-3">

          <div className="w-full max-w-[500px] rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-[#eee5db] px-5 py-4">

              <div>
                <h3 className="font-serif text-xl font-bold">
                  {editingItem
                    ? "Edit Inventory"
                    : "Add Inventory"}
                </h3>

                <p className="mt-1 text-[11px] text-[#888]">
                  Set the requirement that residents will see.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5eee4] text-[#a70e18]"
              >
                <i className="fa-solid fa-xmark" />
              </button>

            </div>

            <div className="space-y-4 p-5">

              <label className="block">
                <span className="mb-1 block text-xs font-semibold">
                  Item Name *
                </span>

                <input
                  value={itemName}
                  onChange={(e) =>
                    setItemName(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Gas Cylinder"
                  className="h-11 w-full rounded-lg border border-[#ddd6cd] px-3 text-sm outline-none focus:border-[#a70e18]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold">
                  Description
                </span>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  rows={2}
                  placeholder="Short description"
                  className="w-full resize-none rounded-lg border border-[#ddd6cd] px-3 py-2 text-sm outline-none focus:border-[#a70e18]"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold">
                    Required Quantity *
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={
                      requiredQuantity
                    }
                    onChange={(e) =>
                      setRequiredQuantity(
                        e.target.value
                      )
                    }
                    placeholder="100"
                    className="h-11 w-full rounded-lg border border-[#ddd6cd] px-3 text-sm outline-none focus:border-[#a70e18]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold">
                    Unit *
                  </span>

                  <select
                    value={unit}
                    onChange={(e) =>
                      setUnit(
                        e.target.value
                      )
                    }
                    className="h-11 w-full rounded-lg border border-[#ddd6cd] bg-white px-3 text-sm outline-none focus:border-[#a70e18]"
                  >
                    <option value="pieces">
                      pieces
                    </option>
                    <option value="cylinder">
                      cylinder
                    </option>
                    <option value="can">
                      can
                    </option>
                    <option value="set">
                      set
                    </option>
                    <option value="chair">
                      chair
                    </option>
                    <option value="table">
                      table
                    </option>
                    <option value="mat">
                      mat
                    </option>
                    <option value="item">
                      item
                    </option>
                  </select>
                </label>

              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold">
                  Font Awesome Icon
                </span>

                <input
                  value={icon}
                  onChange={(e) =>
                    setIcon(
                      e.target.value
                    )
                  }
                  placeholder="fa-box"
                  className="h-11 w-full rounded-lg border border-[#ddd6cd] px-3 text-sm outline-none focus:border-[#a70e18]"
                />

                <p className="mt-1 text-[10px] text-[#999]">
                  Example: fa-chair, fa-table, fa-plug
                </p>
              </label>

              {message && (
                <div className="rounded-lg bg-[#fff8e7] px-3 py-2 text-xs text-[#765f53]">
                  {message}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">

                <button
                  type="button"
                  onClick={() =>
                    setShowForm(false)
                  }
                  className="h-11 rounded-lg border border-[#ddd6cd] bg-white text-sm font-semibold text-[#666]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveItem}
                  disabled={saving}
                  className="h-11 rounded-lg bg-[#a70e18] text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingItem
                      ? "Update Inventory"
                      : "Add Inventory"}
                </button>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}