"use client";

import { useRef, useEffect, useState } from "react";
import {
  RotateCcw,
  Save,
  X,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { usePcBuildState, SLOTS } from "@/hooks/usePcBuildState";
import { useAiSmartBuild } from "@/hooks/useAiSmartBuild";
import { usePcHardwareAnalysis } from "@/hooks/usePcHardwareAnalysis";
import { usePcBuildsCRUD } from "@/hooks/usePcBuildsCRUD";
import BuildSlot from "./BuildSlot";
import BuildPickerModal from "./BuildPickerModal";
import SummaryPanel from "./SummaryPanel";
import BottleneckReport from "./BottleneckReport";
import SmartBuildDropdown from "./SmartBuildDropdown";
import MyBuildsList from "./MyBuildsList";
import SaveBuildModal from "./SaveBuildModal";
import ConfirmSelectionModal from "./ConfirmSelectionModal";
import DeleteBuildModal from "./DeleteBuildModal";

export default function BuildPage() {
  const { user } = useAuthStore();
  const [showSmartBuildDropdown, setShowSmartBuildDropdown] = useState(false);

  // 1. Core Build State Hook
  const {
    build,
    setBuild,
    activeSlot,
    setActiveSlot,
    addingToCart,
    showConfirmModal,
    setShowConfirmModal,
    pendingSelection,
    extraStorageSlots,
    allSlots,
    selectedCount,
    totalPrice,
    compatNotes: baseCompatNotes,
    handleSelect,
    confirmPendingSelection,
    cancelPendingSelection,
    handleRemove,
    handleReset,
    handleAddAllToCart,
  } = usePcBuildState();

  // 2. Hardware Analysis Hook (depends on build)
  const {
    bottleneckResult,
    loadingBottleneck,
    bottleneckError,
    cpuAdvice,
    aiPsuWattage,
    aiPsuExplanation,
    loadingPsu,
  } = usePcHardwareAnalysis({ build });

  // 3. AI Smart Build Hook (depends on build, setBuild, showSmartBuildDropdown, setShowSmartBuildDropdown)
  const {
    smartBuildNeed,
    setSmartBuildNeed,
    smartBuildBudget,
    setSmartBuildBudget,
    isGeneratingSmartBuild,
    smartBuildStatus,
    aiBuildNote,
    setAiBuildNote,
    handleSmartBuildSubmit,
  } = useAiSmartBuild({
    build,
    setBuild,
    showSmartBuildDropdown,
    setShowSmartBuildDropdown,
  });

  // 4. Custom Builds CRUD Hook (depends on build, setBuild, selectedCount)
  const {
    activeTab,
    setActiveTab,
    myBuilds,
    loadingMyBuilds,
    showSaveModal,
    setShowSaveModal,
    buildName,
    setBuildName,
    savingBuild,
    errors,
    setErrors,
    showDeleteConfirmModal,
    setShowDeleteConfirmModal,
    pendingDeleteBuildId,
    handleSaveClick,
    handleSaveConfirm,
    loadSavedBuild,
    handleDeleteBuildClick,
    confirmDeleteBuild,
    cancelDeleteBuild,
  } = usePcBuildsCRUD({
    build,
    setBuild,
    selectedCount,
  });

  // Compose / Append cpuAdvice from hardwareAnalysis to compatNotes
  const compatNotes = [...baseCompatNotes];
  if (cpuAdvice) {
    compatNotes.push({
      type: "info",
      text: `🤖 Gợi ý từ AI: ${cpuAdvice}`,
    });
  }

  // Calculate dynamic showCompatNotes based on composed compatNotes
  const showCompatNotes =
    compatNotes.length > 0 &&
    (!build.mainboard || compatNotes.some((note) => note.type === "warning"));

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowSmartBuildDropdown(false);
      }
    };
    if (showSmartBuildDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSmartBuildDropdown, setShowSmartBuildDropdown]);

  return (
    <div
      className="flex flex-col min-h-screen w-full"
      style={{
        background: "linear-gradient(180deg, #f7f9fb 0%, #f0f4f8 100%)",
      }}
    >
      {/* HEADER */}
      <div className="w-full bg-white/80 backdrop-blur-md border-b border-[#e2e8f0]/80 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[11px] font-bold text-[#0058be] uppercase tracking-[1.2px]">
                PCMaster Builder
              </p>
              <h1
                className="text-[20px] font-black text-[#0f172a] tracking-tight"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Xây dựng cấu hình PC
              </h1>
            </div>
            {/* Nav Tabs */}
            {activeTab === "builder" ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab("my-builds")}
                  className="flex items-center gap-1.5 bg-white border border-[#cbd5e1] hover:border-[#0058be] text-[#334155] hover:text-[#0058be] text-[13px] font-bold px-4 py-2 rounded-[10px] shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  <span>📂</span>
                  <span>Cấu hình đã lưu</span>
                </button>
                <SmartBuildDropdown
                  smartBuildNeed={smartBuildNeed}
                  setSmartBuildNeed={setSmartBuildNeed}
                  smartBuildBudget={smartBuildBudget}
                  setSmartBuildBudget={setSmartBuildBudget}
                  isGeneratingSmartBuild={isGeneratingSmartBuild}
                  smartBuildStatus={smartBuildStatus}
                  handleSmartBuildSubmit={handleSmartBuildSubmit}
                  showSmartBuildDropdown={showSmartBuildDropdown}
                  setShowSmartBuildDropdown={setShowSmartBuildDropdown}
                  dropdownRef={dropdownRef}
                />
              </div>
            ) : (
              <button
                onClick={() => setActiveTab("builder")}
                className="flex items-center gap-1.5 bg-[#0058be] hover:bg-[#0047a3] text-white text-[13px] font-bold px-4 py-2 rounded-[10px] shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <span>🛠️</span>
                <span>Thiết kế PC</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "builder" && selectedCount > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleSaveClick}
                  className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#0058be] text-white text-[13px] font-bold hover:bg-[#0047a3] shadow-md shadow-blue-100 transition-all cursor-pointer"
                >
                  <Save className="size-3.5" />
                  Lưu cấu hình
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-white border border-[#e8ecf2] text-[#64748b] text-[13px] font-semibold hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
                >
                  <RotateCcw className="size-3.5" />
                  Đặt lại
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-[1400px] mx-auto w-full px-8 py-8 flex-1">
        {activeTab === "builder" ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
            {/* LEFT BUILD SLOTS */}
            <div className="flex flex-col gap-3">
              {/* AI Advice Comment Box */}
              {aiBuildNote && (
                <div className="bg-white border border-violet-100 rounded-[24px] p-6 flex flex-col gap-4 shadow-sm mb-3">
                  <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
                    <div className="flex items-center gap-2.5 text-violet-700 font-extrabold text-[14px] uppercase tracking-[0.5px]">
                      <Sparkles className="size-4 shrink-0 text-violet-600 animate-pulse" />
                      Nhận xét cấu hình từ Trợ lý AI
                    </div>
                    <button
                      type="button"
                      onClick={() => setAiBuildNote(null)}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="text-[13px] text-slate-700 leading-relaxed font-medium bg-slate-50/50 p-4 border border-slate-200/60 rounded-[16px]">
                    <MarkdownText text={aiBuildNote} />
                  </div>
                </div>
              )}

              {/* ML Bottleneck Report */}
              <BottleneckReport
                build={build}
                bottleneckResult={bottleneckResult}
                loadingBottleneck={loadingBottleneck}
                bottleneckError={bottleneckError}
              />

              {/* Compatibility Warning Box */}
              {showCompatNotes && (
                <div className="bg-white border border-[#e8ecf2] rounded-[24px] p-6 flex flex-col gap-4 shadow-sm mb-3">
                  <div className="flex items-center gap-2.5 text-[#0058be] font-extrabold text-[14px] uppercase tracking-[0.5px]">
                    <span className="flex items-center justify-center size-6 rounded-full bg-[#eff6ff] text-[12px] shadow-sm">
                      💡
                    </span>
                    Gợi ý tương thích hệ thống
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {compatNotes.map((note, index) => (
                      <div
                        key={index}
                        className={`text-[12.5px] px-4 py-3 rounded-[12px] border font-medium leading-relaxed transition-colors ${
                          note.type === "warning"
                            ? "bg-rose-50/40 border-rose-100 text-rose-700"
                            : "bg-[#eff6ff]/30 border-blue-100/40 text-[#0058be]"
                        }`}
                      >
                        {note.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Core Slots */}
              <p className="text-[11px] font-black text-[#94a3b8] uppercase tracking-[1.5px] px-1 mt-2">
                🔧 Linh kiện cốt lõi
              </p>
              <div className="flex flex-col gap-3">
                {SLOTS.filter((s) => s.required).map((slot) => (
                  <BuildSlot
                    key={slot.key}
                    slotKey={slot.key}
                    label={slot.label}
                    description={slot.description}
                    Icon={slot.Icon}
                    product={build[slot.key]}
                    onPick={() => setActiveSlot(slot.key)}
                    onRemove={() => handleRemove(slot.key)}
                  />
                ))}
              </div>

              {/* Optional Slots */}
              <p className="text-[11px] font-black text-[#94a3b8] uppercase tracking-[1.5px] px-1 mt-4">
                ✨ Linh kiện tùy chọn
              </p>
              <div className="flex flex-col gap-3">
                {SLOTS.filter((s) => !s.required).map((slot) => (
                  <BuildSlot
                    key={slot.key}
                    slotKey={slot.key}
                    label={slot.label}
                    description={slot.description}
                    Icon={slot.Icon}
                    product={build[slot.key]}
                    onPick={() => setActiveSlot(slot.key)}
                    onRemove={() => handleRemove(slot.key)}
                  />
                ))}
                {extraStorageSlots.map((slot) => (
                  <BuildSlot
                    key={slot.key}
                    slotKey={slot.key}
                    label={slot.label}
                    description={slot.description}
                    Icon={slot.Icon}
                    product={build[slot.key]}
                    onPick={() => setActiveSlot(slot.key)}
                    onRemove={() => handleRemove(slot.key)}
                  />
                ))}
              </div>
            </div>

            {/* RIGHT SIDE SUMMARY PANEL */}
            <SummaryPanel
              build={build}
              totalPrice={totalPrice}
              onAddAllToCart={handleAddAllToCart}
              adding={addingToCart}
              extraStorageSlots={extraStorageSlots}
              aiPsuWattage={aiPsuWattage}
              aiPsuExplanation={aiPsuExplanation}
              loadingPsu={loadingPsu}
            />
          </div>
        ) : (
          <MyBuildsList
            myBuilds={myBuilds}
            loadingMyBuilds={loadingMyBuilds}
            user={user}
            loadSavedBuild={loadSavedBuild}
            handleDeleteBuildClick={handleDeleteBuildClick}
            setActiveTab={setActiveTab}
          />
        )}
      </div>

      {/* Pick Part Modal */}
      {activeSlot && (
        <BuildPickerModal
          slotKey={activeSlot}
          slotLabel={
            allSlots.find((s) => s.key === activeSlot)?.label ?? activeSlot
          }
          build={build}
          onSelect={(p) => handleSelect(activeSlot, p)}
          onClose={() => setActiveSlot(null)}
          aiPsuWattage={aiPsuWattage}
        />
      )}

      {/* Save Modal */}
      <SaveBuildModal
        showSaveModal={showSaveModal}
        setShowSaveModal={setShowSaveModal}
        buildName={buildName}
        setBuildName={setBuildName}
        savingBuild={savingBuild}
        errors={errors}
        setErrors={setErrors}
        handleSaveConfirm={handleSaveConfirm}
      />

      {/* Incompatibility Warn Modal */}
      <ConfirmSelectionModal
        showConfirmModal={showConfirmModal}
        pendingSelection={pendingSelection}
        cancelPendingSelection={cancelPendingSelection}
        confirmPendingSelection={confirmPendingSelection}
        build={build}
      />

      {/* Delete Saved Build Modal */}
      <DeleteBuildModal
        showDeleteConfirmModal={showDeleteConfirmModal}
        pendingDeleteBuildId={pendingDeleteBuildId}
        cancelDeleteBuild={cancelDeleteBuild}
        confirmDeleteBuild={confirmDeleteBuild}
      />
    </div>
  );
}

function MarkdownText({ text }: { text: string }) {
  const html = text
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, "<br />")
    .replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-extrabold text-slate-900">$1</strong>',
    )
    .replace(/\*(.*?)\*/g, '<em class="italic text-slate-600">$1</em>')
    .replace(
      /(?:^|<br \/>)\s*[-•]\s+(.*?)(?=<br \/>|$)/g,
      '<li class="ml-4 list-disc text-slate-700 mt-1">$1</li>',
    );

  return <div dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }} />;
}
