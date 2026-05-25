import { createActor } from "@/backend";
import type { GroceryItem } from "@/backend";
import { Layout } from "@/components/Layout";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckSquare,
  Plus,
  ShoppingCart,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function GroceryList() {
  const { actor, isFetching } = useActor(createActor);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("Other");
  const [isRecurring, setIsRecurring] = useState(false);

  const { data: items = [], isLoading } = useQuery<GroceryItem[]>({
    queryKey: ["groceryItems"],
    queryFn: async () => (actor ? actor.listGroceryItems() : []),
    enabled: !!actor && !isFetching,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !name.trim()) throw new Error("Name required");
      const unit = isRecurring ? `${category} · Recurring` : category;
      await actor.addGroceryItem(name.trim(), quantity.trim() || "1", unit);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groceryItems"] });
      setOpen(false);
      setName("");
      setQuantity("");
      setCategory("Other");
      setIsRecurring(false);
      toast.success("Item added");
    },
    onError: () => toast.error("Could not add item"),
  });

  const markMutation = useMutation({
    mutationFn: async (item: GroceryItem) => {
      if (!actor) throw new Error("Not connected");
      await actor.updateGroceryItem(
        item.id,
        item.name,
        item.quantity,
        item.unit,
        true,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groceryItems"] }),
    onError: () => toast.error("Could not update item"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteGroceryItem(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groceryItems"] }),
  });

  const clearBought = async () => {
    const bought = items.filter((i) => i.isPurchased);
    for (const item of bought) {
      await deleteMutation.mutateAsync(item.id);
    }
    toast.success("Cleared bought items");
  };

  const pending = items.filter((i) => !i.isPurchased);
  const bought = items.filter((i) => i.isPurchased);

  return (
    <Layout>
      <div className="min-h-screen bg-white pb-24" data-ocid="grocery.page">
        <div className="px-4 pt-6 pb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6b7280] uppercase tracking-widest mb-1">
              Family Mode
            </p>
            <h1 className="text-2xl font-bold text-[#111827]">Grocery</h1>
          </div>
          <div className="flex items-center gap-2">
            {bought.length > 0 && (
              <button
                type="button"
                onClick={clearBought}
                data-ocid="grocery.clear_bought_button"
                className="text-xs border border-[#DCFCE7] text-[#6b7280] px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} /> Clear bought
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(true)}
              data-ocid="grocery.add_button"
              className="w-10 h-10 rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-white flex items-center justify-center shadow-sm transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {items.length > 0 && (
          <div className="mx-4 mb-4 flex gap-3">
            <div className="flex-1 bg-white rounded-xl border border-[#DCFCE7] shadow-sm p-3 flex items-center gap-2">
              <ShoppingCart size={16} className="text-[#22C55E]" />
              <span className="text-sm font-medium text-[#111827]">
                {pending.length} to buy
              </span>
            </div>
            <div className="flex-1 bg-white rounded-xl border border-[#DCFCE7] shadow-sm p-3 flex items-center gap-2">
              <CheckSquare size={16} className="text-[#22C55E]" />
              <span className="text-sm font-medium text-[#111827]">
                {bought.length} bought
              </span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="px-4" data-ocid="grocery.loading_state">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-xl h-14 mb-3 animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div
            className="mx-4 rounded-xl border border-[#DCFCE7] bg-white p-10 flex flex-col items-center gap-3"
            data-ocid="grocery.empty_state"
          >
            <ShoppingCart size={36} className="text-[#DCFCE7]" />
            <p className="text-sm text-[#6b7280] text-center">
              List is empty. Time to restock.
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-1 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors"
              data-ocid="grocery.add_first_button"
            >
              Add First Item
            </button>
          </div>
        ) : (
          <div className="px-4 flex flex-col gap-2">
            {items.map((item, idx) => (
              <div
                key={item.id.toString()}
                className={`bg-white rounded-xl shadow-sm border border-[#DCFCE7] p-4 flex items-center gap-3 ${item.isPurchased ? "opacity-60" : ""}`}
                data-ocid={`grocery.item.${idx + 1}`}
              >
                <button
                  type="button"
                  onClick={() => !item.isPurchased && markMutation.mutate(item)}
                  data-ocid={`grocery.checkbox.${idx + 1}`}
                  aria-label={item.isPurchased ? "Purchased" : "Mark purchased"}
                  className="flex-shrink-0"
                >
                  {item.isPurchased ? (
                    <CheckSquare size={20} className="text-[#22C55E]" />
                  ) : (
                    <Square size={20} className="text-[#DCFCE7]" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${item.isPurchased ? "line-through text-[#6b7280]" : "text-[#111827]"}`}
                  >
                    {item.name}
                  </p>
                  {(item.quantity || item.unit) && (
                    <p className="text-xs text-[#6b7280] mt-0.5">
                      {item.quantity}
                      {item.unit ? ` ${item.unit}` : ""}
                    </p>
                  )}
                </div>
                {item.isPurchased && (
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(item.id)}
                    data-ocid={`grocery.delete_button.${idx + 1}`}
                    aria-label="Delete item"
                    className="text-[#DCFCE7] hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {open && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            data-ocid="grocery.dialog"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpen(false)}
              aria-label="Close"
            />
            <div className="relative w-full max-w-md bg-white rounded-t-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-[#111827] text-lg">
                  Add Item
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  data-ocid="grocery.close_button"
                >
                  <X size={20} className="text-[#6b7280]" />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="grocery-name"
                    className="block text-xs text-[#6b7280] mb-1.5 font-medium"
                  >
                    Item Name *
                  </label>
                  <input
                    id="grocery-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tomatoes"
                    className="w-full border border-[#DCFCE7] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                    data-ocid="grocery.name_input"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label
                      htmlFor="grocery-quantity"
                      className="block text-xs text-[#6b7280] mb-1.5 font-medium"
                    >
                      Quantity
                    </label>
                    <input
                      id="grocery-quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="2"
                      className="w-full border border-[#DCFCE7] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                      data-ocid="grocery.quantity_input"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="grocery-category"
                      className="block text-xs text-[#6b7280] mb-1.5 font-medium"
                    >
                      Category
                    </label>
                    <select
                      id="grocery-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border border-[#DCFCE7] bg-white rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                      data-ocid="grocery.category_select"
                    >
                      {[
                        "Vegetables",
                        "Dairy",
                        "Household",
                        "Personal",
                        "Other",
                      ].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    id="recurring-toggle"
                    onClick={() => setIsRecurring(!isRecurring)}
                    data-ocid="grocery.recurring_toggle"
                    className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                      isRecurring ? "bg-[#22C55E]" : "bg-gray-200"
                    }`}
                    aria-label="Toggle recurring"
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        isRecurring ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <label
                    htmlFor="recurring-toggle"
                    className="text-xs text-[#6b7280] font-medium"
                  >
                    Recurring item
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => addMutation.mutate()}
                  disabled={addMutation.isPending || !name.trim()}
                  data-ocid="grocery.submit_button"
                  className="w-full bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
                >
                  {addMutation.isPending ? "Adding..." : "Add to List"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
