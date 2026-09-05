"use client";

import { useState } from "react";

type Step = 1 | 2 | 3 | 4;

const DURGA_IMAGE =
  "/images/durga-puja-collection.webp";

export default function ContributePage() {
  const [step, setStep] = useState<Step>(1);

  const [name, setName] = useState("");
  const [flatNo, setFlatNo] = useState("");
  const [mobile, setMobile] = useState("");
  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const upiId =
    process.env.NEXT_PUBLIC_UPI_ID || "9036082478@ptsbi";

  const upiName =
    process.env.NEXT_PUBLIC_UPI_NAME || "BUH Durga Puja";

  const numericAmount = Number(amount);

  const upiUrl =
    `upi://pay` +
    `?pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent(upiName)}` +
    `&am=${numericAmount.toFixed(2)}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(
      `BUH Durga Puja - ${flatNo}`
    )}`;

  /*
   * QR is generated as an IMAGE URL.
   * No SVG required.
   */
  const qrUrl =
    `https://api.qrserver.com/v1/create-qr-code/` +
    `?size=400x400` +
    `&margin=10` +
    `&data=${encodeURIComponent(upiUrl)}`;

  function continueToPayment() {
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!flatNo.trim()) {
      setError("Please enter your flat number.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid contribution amount.");
      return;
    }

    setStep(2);
  }

  async function submitContribution() {
    setError("");

    if (!utr.trim()) {
      setError("Please enter the UTR / Transaction ID.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/contributions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            flatNo,
            mobile,
            amount: numericAmount,
            utr,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to submit contribution."
        );
        return;
      }

      setStep(4);
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Font Awesome - URL based icons */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
      />

      <main className="font-sans text-[#292929] [font-family:Inter,Arial,Helvetica,sans-serif] relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_50%_10%,#fffaf2_0%,#f8eddd_48%,#efdfca_100%)] px-4 py-[24px] pb-[36px] max-[600px]:px-2 max-[600px]:py-2 max-[600px]:pb-5">

        {/* =================================================
            DECORATIVE BACKGROUND
        ================================================= */}

        <div className="pointer-events-none fixed left-[-290px] top-[150px] h-[420px] w-[420px] rounded-full opacity-[0.12] bg-[repeating-radial-gradient(circle,transparent_0px,transparent_18px,#c99336_19px,transparent_21px)]" />
        <div className="pointer-events-none fixed right-[-290px] bottom-[100px] h-[420px] w-[420px] rounded-full opacity-[0.12] bg-[repeating-radial-gradient(circle,transparent_0px,transparent_18px,#c99336_19px,transparent_21px)]" />

        <div className="pointer-events-none fixed bottom-[-180px] left-[-170px] h-[700px] w-[270px] rotate-[18deg] opacity-90 bg-[linear-gradient(135deg,transparent_0_15%,#b80c15_16%,#e32328_38%,#a90913_65%,transparent_66%)] drop-shadow-[0_10px_15px_rgba(80,0,0,0.08)]" />
        <div className="pointer-events-none fixed right-[-180px] bottom-[-170px] h-[700px] w-[270px] -rotate-[18deg] opacity-90 bg-[linear-gradient(135deg,transparent_0_15%,#b80c15_16%,#e32328_38%,#a90913_65%,transparent_66%)] drop-shadow-[0_10px_15px_rgba(80,0,0,0.08)]" />

        <div className="pointer-events-none fixed bottom-[90px] left-[-25px] text-[100px] text-[#d09a34] opacity-[0.18]">
          ✿
        </div>

        <div className="pointer-events-none fixed right-[-25px] bottom-[140px] text-[100px] text-[#d09a34] opacity-[0.18]">
          ✿
        </div>


        <div className="relative z-[5] mx-auto w-full max-w-[650px] max-[850px]:max-w-[760px] mt-[30]">


          {/* =================================================
              HERO
          ================================================= */}

          <section className="relative min-h-[250px] overflow-visible rounded-[24px] border border-[#ead9c7] bg-gradient-to-br from-white/[0.97] to-[#fff9ef]/[0.98] px-7 pb-5 pt-5 shadow-[0_18px_50px_rgba(77,48,20,0.10)] max-[600px]:min-h-[285px] max-[600px]:rounded-[18px] max-[600px]:px-3 max-[600px]:pb-3 max-[600px]:pt-3">

            {/* Decorative top pattern */}
            <div className="pointer-events-none absolute inset-0 rounded-[28px] opacity-[0.12] bg-[radial-gradient(circle_at_15%_25%,#d3a044_1px,transparent_2px)] bg-[size:30px_30px]" />


            {/* Left message */}

            <div className="absolute left-[55px] top-[105px] z-[5] flex flex-col gap-0 text-left text-[10px] font-bold leading-[1.8] tracking-[4px] text-[#73594b] max-[850px]:left-6 max-[600px]:hidden">

              <span>TOGETHER</span>
              <span>WE CELEBRATE</span>
              <span>OUR COMMUNITY</span>

              <div className="mt-2 h-[2px] w-10 bg-[#d09a32]" />

            </div>


            {/* Right message */}

            <div className="absolute right-[55px] top-[105px] z-[5] flex flex-col items-end gap-0 text-right text-[10px] font-bold leading-[1.8] tracking-[4px] text-[#73594b] max-[850px]:right-6 max-[600px]:hidden">

              <span>FAITH</span>
              <span>COMMUNITY</span>
              <span>HARMONY</span>

              <div className="mt-2 h-[2px] w-10 bg-[#d09a32]" />

            </div>


            {/* =================================================
                DURGA IMAGE
            ================================================= */}

            <div className="absolute left-1/2 top-[-50px] z-[4] flex h-[270px] w-[270px] -translate-x-1/2 justify-center max-[600px]:top-[-10px] max-[600px]:h-[170px] max-[600px]:w-[170px]">

              <div className="absolute -top-[25px] h-[270px] w-[270px] rounded-full bg-[radial-gradient(circle,rgba(210,157,47,0.25),transparent_68%)] max-[600px]:h-[200px] max-[600px]:w-[200px]" />

              <img
                src={DURGA_IMAGE}
                alt="Maa Durga"
                className="relative z-[1] h-[270px] w-[270px] object-contain object-center max-[600px]:h-[170px] max-[600px]:w-[170px]"
              />

            </div>


            {/* =================================================
                HERO CONTENT
            ================================================= */}

            <div className="relative z-[6] pt-[215px] text-center max-[600px]:pt-[145px]">

              <div className="text-[10px] font-bold tracking-[5px] text-[#795044] max-[600px]:text-[7px] max-[600px]:tracking-[2px]">
                COMMUNITY CONTRIBUTION
              </div>

              <h1 className="mt-2 text-[30px] font-bold leading-[1.02] text-[#a80d17] font-open-sans max-[600px]:text-[27px]">
                BUH Durga Puja 2026
              </h1>

              <p className="mt-2 font-serif text-[15px] italic text-[#7b5b4e] max-[600px]:text-[11px]">
                Let&apos;s come together to make this
                celebration grander!
              </p>


              <div className="mt-3 flex items-center justify-center gap-3 text-[#d09a32] max-[600px]:mt-2">

                <span />

                <i className="text-[23px] text-[#a70e18] fa-solid fa-spa" />

                <span />

              </div>

            </div>

          </section>


          {/* =================================================
              STEPS
          ================================================= */}

          <section className="flex items-start px-6 pb-3 pt-3 max-[600px]:px-0 max-[600px]:pb-2 max-[600px]:pt-2">

            <StepItem
              number="1"
              title="Contribution Details"
              active={step >= 1}
              completed={step > 1}
            />

            <div
              className={`mt-[22px] h-px flex-1 bg-[#d7d8db] max-[600px]:mt-[18px] ${step > 1 ? "bg-[#c79531]" : ""}`}
            />

            <StepItem
              number="2"
              title="Make Payment"
              active={step >= 2}
              completed={step > 2}
            />

            <div
              className={`mt-[22px] h-px flex-1 bg-[#d7d8db] max-[600px]:mt-[18px] ${step > 2 ? "bg-[#c79531]" : ""}`}
            />

            <StepItem
              number="3"
              title="Submit UTR"
              active={step >= 3}
              completed={step > 3}
            />

          </section>


          {/* =================================================
              STEP 1
          ================================================= */}

          {step === 1 && (

            <section className="relative overflow-hidden rounded-[22px] border border-[rgba(177,146,105,0.12)] bg-white shadow-[0_14px_35px_rgba(68,44,20,0.10)] max-[600px]:rounded-[16px]">

              <div className="px-6 pb-2 pt-5 max-[600px]:px-3 max-[600px]:pb-1 max-[600px]:pt-3">

                <div className="mb-3 max-[600px]:mb-2">

                  <h2 className="m-0 font-serif text-[25px] text-[#292929] max-[600px]:text-[19px]">
                    Contribution Details
                  </h2>

                  <p className="mt-2 text-[13px] text-[#737983] max-[600px]:text-[9px] max-[600px]:leading-[1.4]">
                    Please share your details to proceed
                    with the payment.
                  </p>

                </div>


                <div className="flex flex-col gap-2">

                  {/* Name */}

                  <InputField
                    icon="fa-user"
                    label="Name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={setName}
                  />


                  {/* Flat */}

                  <InputField
                    icon="fa-house"
                    label="Flat No."
                    placeholder="Example: A-203"
                    value={flatNo}
                    onChange={setFlatNo}
                  />


                  {/* Mobile */}

                  <div className="flex flex-col gap-1">

                    <label>
                      Mobile Number
                    </label>

                    <div className="flex min-h-[52px] items-center rounded-[11px] border border-[#dedede] bg-white transition duration-200 focus-within:border-[#b3121b] focus-within:shadow-[0_0_0_4px_rgba(179,18,27,0.06)] max-[600px]:min-h-[47px]">

                      <div className="flex w-[48px] shrink-0 items-center justify-center text-[16px] text-[#a70e18] max-[600px]:w-[40px]">
                        <i className="fa-solid fa-phone" />
                      </div>

                      <div className="pr-3 text-[12px] text-[#555] max-[600px]:pr-2 max-[600px]:text-[9px]">
                        🇮🇳 <span>+91</span>
                      </div>

                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={mobile}
                        onChange={(e) =>
                          setMobile(
                            e.target.value.replace(
                              /\D/g,
                              ""
                            )
                          )
                        }
                      />

                    </div>

                  </div>


                  {/* Amount */}

                  <div className="flex flex-col gap-1">

                    <label>
                      Contribution Amount
                    </label>

                    <div className="grid grid-cols-[minmax(220px,1fr)_auto] items-center gap-2 max-[850px]:grid-cols-1">

                      <div className="flex min-h-[52px] items-center rounded-[11px] border border-[#dedede] bg-white transition duration-200 focus-within:border-[#b3121b] focus-within:shadow-[0_0_0_4px_rgba(179,18,27,0.06)] max-[600px]:min-h-[47px]">

                        <div className="flex w-[48px] shrink-0 items-center justify-center text-[16px] text-[#a70e18] max-[600px]:w-[40px]">
                          <span>₹</span>
                        </div>

                        <input
                          type="number"
                          min="1"
                          placeholder="Enter amount (in ₹)"
                          value={amount}
                          onChange={(e) =>
                            setAmount(
                              e.target.value
                            )
                          }
                        />

                      </div>


                      <div className="flex gap-1 max-[850px]:justify-start max-[600px]:grid max-[600px]:grid-cols-4 max-[600px]:gap-[5px]">

                        {[501, 1001, 2501, 5001].map(
                          (value) => (

                            <button
                              key={value}
                              type="button"
                              className={`h-[38px] rounded-[9px] border border-[#f0d9d9] bg-[#fbefef] px-3 text-[11px] font-bold text-[#a20f18] transition duration-200 hover:border-[#a70e18] hover:bg-[#a70e18] hover:text-white max-[600px]:h-[34px] max-[600px]:w-full max-[600px]:px-0 max-[600px]:text-[9px] ${Number(amount) === value ? "!border-[#a70e18] !bg-[#a70e18] !text-white" : ""}`}
                              onClick={() =>
                                setAmount(
                                  String(value)
                                )
                              }
                            >
                              ₹
                              {value.toLocaleString(
                                "en-IN"
                              )}
                            </button>

                          )
                        )}

                      </div>

                    </div>

                  </div>


                  {/* Error */}

                  {error && (
                    <div className="flex items-center gap-[9px] rounded-[9px] border border-[#f1cccc] bg-[#fff1f1] px-2.5 py-2 text-[12px] text-[#a20d16]">

                      <i className="fa-solid fa-circle-exclamation" />

                      <span>{error}</span>

                    </div>
                  )}


                  {/* CTA */}

                  <button
                    type="button"
                    className="flex min-h-[50px] w-full items-center justify-center gap-[15px] rounded-[12px] border-0 bg-gradient-to-br from-[#a70812] to-[#c70d18] text-[14px] font-bold text-white no-underline shadow-[0_10px_23px_rgba(167,8,18,0.20)] transition duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={continueToPayment}
                  >

                    <span>
                      Continue to Payment
                    </span>

                    <i className="fa-solid fa-arrow-right" />

                  </button>

                </div>


                {/* Security */}

                <div className="my-2 mb-2 flex items-center justify-center gap-2 text-[12px] text-[#687078]">

                  <i className="fa-solid fa-lock" />

                  <span>
                    Your information is safe and secure
                  </span>

                </div>

              </div>


              {/* =================================================
                  BENEFITS
              ================================================= */}

              <Benefits />

            </section>
          )}


          {/* =================================================
              PAYMENT
          ================================================= */}

          {step === 2 && (

            <section className="relative overflow-hidden rounded-[22px] border border-[rgba(177,146,105,0.12)] bg-white shadow-[0_14px_35px_rgba(68,44,20,0.10)] max-[600px]:rounded-[16px]">

              <div className="px-[45px] pb-6 pt-6 max-[600px]:px-4 max-[600px]:pb-[17px] max-[600px]:pt-[26px]">

                <div className="mb-[26px] text-center max-[600px]:mb-[22px]">

                  <h2 className="m-0 font-serif text-[25px] text-[#292929] max-[600px]:text-[19px]">
                    Make Your Contribution
                  </h2>

                  <p className="mt-2 text-[14px] text-[#737983]">
                    Scan the QR code using any UPI app
                    to complete your payment.
                  </p>

                </div>


                <div className="flex items-center justify-between rounded-[13px] bg-[#fcf8f1] px-[18px] py-[15px]">

                  <span>
                    Contribution Amount
                  </span>

                  <strong>
                    ₹
                    {numericAmount.toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                </div>


                <div className="mt-[23px] text-center">

                  <div className="inline-flex rounded-[17px] border border-[#ededed] bg-white p-3 shadow-[0_8px_25px_rgba(0,0,0,0.07)] w-[50%]">

                    <img
                      src={qrUrl}
                      alt="UPI Payment QR Code"
                    />

                  </div>

                </div>


               <div className="mb-[18px] flex flex-col items-center text-center">

                {/* Payment instruction */}
                <p className="mb-3 text-[16px] text-[#222]">
                  Scan with Google Pay, PhonePe, Paytm or any UPI app
                </p>

                {/* Paying towards */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="text-[16px] text-[#222]">
                    Paying towards
                  </span>

                  <strong className="text-[16px] font-semibold text-[#222]">
                    {upiName}
                  </strong>

                  {/* UPI ID */}
                  <div className="ml-1 inline-flex items-center gap-2 rounded-lg bg-[#f6f6f6] px-3 py-[7px] text-[12px] text-[#737373]">
                    <span>{upiId}</span>

                    <button
                      type="button"
                      className="text-[#737373] transition hover:text-[#333]"
                      onClick={() =>
                        navigator.clipboard?.writeText(upiId)
                      }
                      aria-label="Copy UPI ID"
                    >
                      <i className="fa-regular fa-copy" />
                    </button>
                  </div>
                </div>

              </div>


                <a
                  href={upiUrl}
                  className="flex min-h-[50px] w-full items-center justify-center gap-[15px] rounded-[12px] border-0 bg-gradient-to-br from-[#a70812] to-[#c70d18] text-[14px] font-bold text-white no-underline shadow-[0_10px_23px_rgba(167,8,18,0.20)] transition duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                >

                  <i className="fa-solid fa-mobile-screen-button" />

                  <span>
                    Open UPI App
                  </span>

                </a>


                <button
                  type="button"
                  className="mt-[13px] flex min-h-[48px] w-full items-center justify-center gap-3 rounded-[11px] border border-[#ccc] bg-white text-[14px] font-bold text-[#444]"
                  onClick={() => setStep(3)}
                >
                  <span>
                    I Have Completed Payment
                  </span>

                  <i className="fa-solid fa-arrow-right" />

                </button>


                <button
                  type="button"
                  className="mt-2 flex w-full items-center justify-center gap-2 border-0 bg-transparent text-[12px] font-semibold text-[#777]"
                  onClick={() => setStep(1)}
                >
                  <i className="fa-solid fa-arrow-left" />

                  Change Details
                </button>

              </div>

            </section>

          )}


          {/* =================================================
              UTR
          ================================================= */}

          {step === 3 && (

            <section className="relative overflow-hidden rounded-[22px] border border-[rgba(177,146,105,0.12)] bg-white shadow-[0_14px_35px_rgba(68,44,20,0.10)] max-[600px]:rounded-[16px]">

              <div className="px-6 pb-2 pt-5 max-[600px]:px-3 max-[600px]:pb-1 max-[600px]:pt-3">

                <div className="mb-[26px] text-center max-[600px]:mb-[22px]">

                  <div className="mx-auto mb-2 flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#faeeee] text-[17px] text-[#a70e18]">

                    <i className="fa-solid fa-receipt" />

                  </div>

                  <h2 className="m-0 font-serif text-[25px] text-[#292929] max-[600px]:text-[19px]">
                    Payment Confirmation
                  </h2>

                  <p className="mt-2 text-[14px] text-[#737983]">
                    Enter the UTR / Transaction ID
                    from your UPI payment.
                  </p>

                </div>


                <div className="mb-5 grid grid-cols-3 gap-3 rounded-[13px] bg-[#fcf8f1] p-[15px] max-[600px]:grid-cols-1">

                  <div>
                    <span>Name</span>
                    <strong> {name}</strong>
                  </div>

                  <div>
                    <span>Flat No.</span>
                    <strong> {flatNo}</strong>
                  </div>

                  <div>
                    <span>Amount </span>
                    <strong>
                      ₹
                       {numericAmount.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                </div>


                <InputField
                  icon="fa-receipt"
                  label="UTR / Transaction ID"
                  placeholder="Enter UTR / Transaction ID"
                  value={utr}
                  onChange={setUtr}
                />


                <div className="my-[15px] mb-[19px] flex gap-2 rounded-[11px] border border-[#f0dfbd] bg-[#fff8eb] px-[15px] py-[13px] text-[#725e3a]">

                  <i className="fa-solid fa-circle-info" />

                  <p>
                    You can find the UTR / Transaction
                    ID in your UPI payment confirmation.
                  </p>

                </div>


                {error && (
                  <div className="flex items-center gap-[9px] rounded-[9px] border border-[#f1cccc] bg-[#fff1f1] px-2.5 py-2 text-[12px] text-[#a20d16]">

                    <i className="fa-solid fa-circle-exclamation" />

                    <span>{error}</span>

                  </div>
                )}


                <button
                  type="button"
                  className="flex min-h-[50px] w-full items-center justify-center gap-[15px] rounded-[12px] border-0 bg-gradient-to-br from-[#a70812] to-[#c70d18] text-[14px] font-bold text-white no-underline shadow-[0_10px_23px_rgba(167,8,18,0.20)] transition duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading}
                  onClick={submitContribution}
                >

                  {loading ? (
                    <>
                      <span>
                        Submitting...
                      </span>

                      <i className="fa-solid fa-spinner fa-spin" />
                    </>
                  ) : (
                    <>
                      <span>
                        Submit Contribution
                      </span>

                      <i className="fa-solid fa-check" />
                    </>
                  )}

                </button>


                <button
                  type="button"
                  className="mt-2 flex w-full items-center justify-center gap-2 border-0 bg-transparent text-[12px] font-semibold text-[#777]"
                  onClick={() => setStep(2)}
                >

                  <i className="fa-solid fa-arrow-left" />

                  Back to Payment

                </button>

              </div>

            </section>
          )}


          {/* =================================================
              SUCCESS
          ================================================= */}

          {step === 4 && (

            <section className="relative overflow-hidden rounded-[22px] border border-[rgba(177,146,105,0.12)] bg-white shadow-[0_14px_35px_rgba(68,44,20,0.10)] max-[600px]:rounded-[16px]">

              <div className="px-[45px] pb-[50px] pt-[45px] text-center max-[600px]:px-[18px] max-[600px]:pb-10 max-[600px]:pt-[35px]">

                <div className="mx-auto mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#a70e18] text-[29px] text-white shadow-[0_12px_28px_rgba(167,14,24,0.20)]">

                  <i className="fa-solid fa-check" />

                </div>

                <h2 className="m-0 font-serif text-[30px] text-[#292929] max-[600px]:text-[26px]">
                  Contribution Submitted
                </h2>

                <p>
                  Thank you, <strong> {name}</strong>.
                </p>

                <p className="mt-2 text-[13px] text-[#707070]">
                  Your contribution details have been
                  successfully submitted.
                </p>


                <div className="mx-auto my-[25px] max-w-[280px] rounded-[13px] bg-[#fcf7ed] p-[17px] gap-2">

                  <span>
                    Contribution 
                  </span>

                  <strong className="ml-2">
                     ₹
                    {numericAmount.toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                </div>


                <div className="mx-auto flex max-w-[500px] gap-[11px] rounded-[12px] border border-[#f0dfbd] bg-[#fff8ea] p-[15px] text-left">

                  <i className="fa-solid fa-shield-halved" />

                  <div>

                    <strong>
                      Submitted for Verification
                    </strong>

                    <p>
                      The Durga Puja committee will
                      verify the payment using the
                      UTR provided.
                    </p>

                  </div>

                </div>


                <div className="mt-7 font-serif text-[12px] font-bold tracking-[5px] text-[#a70e18]">
                  JAI MAA DURGA
                </div>

              </div>

            </section>
          )}


          {/* =================================================
              FOOTER
          ================================================= */}

          <footer>

            <div className="flex items-center justify-center gap-3 pt-7 text-[#c8952e]">

              <span className="h-px w-[65px] bg-[#c8952e]" />

              <i className="text-[17px] text-[#c8952e] fa-solid fa-spa" />

              <span className="h-px w-[65px] bg-[#c8952e]" />

            </div>

            <div className="relative z-[6] text-center max-[600px]:pt-[145px]">

            <h3 className="mt-[9px] font-serif text-[13px] font-bold tracking-[5px] text-[#a70e18] max-[600px]:text-[11px] max-[600px]:tracking-[4px]">
              JAI MAA DURGA
            </h3>

            <p className="mt-[7px] text-[9px] tracking-[4px] text-[#7b6d60]">
              A STRONGER COMMUNITY TOGETHER
            </p>

            </div>

          </footer>


        </div>

      </main>


      {/* =====================================================
          CSS
      ===================================================== */}


    </>
  );
}


/* ==========================================================
   INPUT FIELD
========================================================== */

function InputField({
  icon,
  label,
  placeholder,
  value,
  onChange,
}: {
  icon: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">

      <label className="text-[13px] font-semibold text-[#333]">{label}</label>

      <div className="flex min-h-[52px] items-center rounded-[11px] border border-[#dedede] bg-white transition duration-200 focus-within:border-[#b3121b] focus-within:shadow-[0_0_0_4px_rgba(179,18,27,0.06)] max-[600px]:min-h-[47px]">

        <div className="flex w-[48px] shrink-0 items-center justify-center text-[16px] text-[#a70e18] max-[600px]:w-[40px]">

          <i
            className={`fa-solid ${icon}`}
          />

        </div>

        <input
          className="h-[60px] flex-1 border-0 bg-transparent text-[15px] text-[#292929] outline-none placeholder:text-[#a1a5ad] max-[600px]:h-[55px] max-[600px]:text-[14px]"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
        />

      </div>

    </div>
  );
}


/* ==========================================================
   STEP
========================================================== */

function StepItem({
  number,
  title,
  active,
  completed,
}: {
  number: string;
  title: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="w-[130px] shrink-0 text-center max-[600px]:w-[75px]">

      <div
        className={`mx-auto flex h-[55px] w-[55px] items-center justify-center rounded-full text-[18px] font-bold max-[600px]:h-[42px] max-[600px]:w-[42px] max-[600px]:text-[14px] ${completed ? "bg-[#c7942f] text-white" : active ? "bg-[#ae0c16] text-white shadow-[0_8px_20px_rgba(174,12,22,0.20)]" : "bg-[#dfe1e4] text-[#777b80]"}`}
      >

        {completed ? (
          <i className="fa-solid fa-check" />
        ) : (
          number
        )}

      </div>

      <div
        className={`mt-[11px] whitespace-nowrap text-[12px] font-semibold max-[600px]:ml-[-2px] max-[600px]:w-20 max-[600px]:whitespace-normal max-[600px]:text-[9px] max-[600px]:leading-[1.3] ${active ? "text-[#ae0c16]" : "text-[#737373]"}`}
      >
        {title}
      </div>

    </div>
  );
}


/* ==========================================================
   BENEFITS
========================================================== */

function Benefits() {
  return (
    <div className="mx-[14px] mb-[14px] mt-0 grid grid-cols-4 rounded-[16px] bg-[#fdf8ef] px-[10px] py-[18px] max-[600px]:mx-2 max-[600px]:mb-2 max-[600px]:grid-cols-2">

      <div className="flex min-h-[70px] flex-col items-center justify-center gap-2 border-r border-[#e1d8cc] text-center max-[600px]:min-h-[80px]">

        <i className="text-[23px] text-[#a70e18] fa-solid fa-users" />

        <span className="text-[12px] font-semibold leading-[1.4] text-[#555]">
          Stronger
          <br />
          Community
        </span>

      </div>


      <div className="flex min-h-[70px] flex-col items-center justify-center gap-2 border-r border-[#e1d8cc] text-center max-[600px]:min-h-[80px]">

        <i className="text-[23px] text-[#a70e18] fa-solid fa-spa" />

        <span className="text-[12px] font-semibold leading-[1.4] text-[#555]">
          Our Culture
          <br />
          Our Pride
        </span>

      </div>


      <div className="flex min-h-[70px] flex-col items-center justify-center gap-2 border-r border-[#e1d8cc] text-center max-[600px]:min-h-[80px]">

        <i className="text-[23px] text-[#a70e18] fa-solid fa-heart" />

        <span className="text-[12px] font-semibold leading-[1.4] text-[#555]">
          Your Support
          <br />
          Makes a Difference
        </span>

      </div>


      <div className="flex min-h-[70px] flex-col items-center justify-center gap-2 border-r border-[#e1d8cc] text-center max-[600px]:min-h-[80px]">

        <i className="text-[23px] text-[#a70e18] fa-solid fa-leaf" />

        <span className="text-[12px] font-semibold leading-[1.4] text-[#555]">
          A Cleaner
          <br />
          Brighter Tomorrow
        </span>

      </div>

    </div>
  );
}