import React, { ChangeEvent, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import USDC from "../../assets/images/usd-logo.png";
import swapbtn from "../../assets/images/swapbtn.png";
import kitty2 from "../../assets/images/kitty2.png";
import { Modal } from "react-bootstrap";
import { ProjectContext } from "../../pages/Swap";
import { AbcUtils, MintData } from "@open-source-economy/poc";
import { BN } from "@coral-xyz/anchor";
import { RedeemData } from "@open-source-economy/poc/dist/sdk/src/abc-utils";
import { ClientContext } from "../../App";
import { useWallet } from "@solana/wallet-adapter-react";

interface SwapCompProps {}

const SwapComp: React.FC<SwapCompProps> = props => {
  const client = useContext(ClientContext);
  const project = useContext(ProjectContext);
  const { publicKey, sendTransaction, signTransaction } = useWallet();

  // @ts-ignore
  const abcUtils: AbcUtils = new AbcUtils(project!.onChainData.abc);

  const [quoteTokenLogo, setQuoteTokenLogo] = useState<string>(USDC);
  const [quoteTokenCode, setQuoteTokenCode] = useState<string>("devUSDC");

  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);

  const [balanceProjectToken, setBalanceProjectToken] = useState<number>();
  const [balanceQuoteToken, setBalanceQuoteToken] = useState<number>();

  const [buyProjectToken, setBuyProjectToken] = useState(true);
  const [inputSellValue, setInputSellValue] = useState<number>();
  const [inputBuyValue, setInputBuyValue] = useState<number>();
  const [minimumBuyAmount, setMinimumBuyAmount] = useState<number>(0);

  const [result, setResult] = useState("");

  const swap = async () => {
    try {
      // Create Associated Token Account in the front end does not work, so I enabled init_if_init in the backend

      // const associatedToken = splToken.getAssociatedTokenAddressSync(project!.onChainData.abc!.quoteTokenMint, publicKey!);
      //
      // const createToken: Transaction = new Transaction().add(
      //   splToken.createAssociatedTokenAccountInstruction(
      //       publicKey!,
      //       associatedToken,
      //       publicKey!,
      //       project!.onChainData.abc!.quoteTokenMint)
      // );
      //
      // let blockhash = await client?.context.provider.connection.getRecentBlockhash("finalized");
      //
      // createToken.recentBlockhash = blockhash!.blockhash;
      // createToken.feePayer = publicKey!;
      //
      // if (signTransaction) {
      //   const tx = await signTransaction(createToken);
      //   const signature = await sendTransaction(tx, client!.context.provider.connection);
      // }

      if (buyProjectToken && inputSellValue) {
        const mintData: MintData = abcUtils.getMintDataFromQuote(new BN(inputSellValue));
        const params = await client!.paramsBuilder.mintProjectToken(project?.onChainData!, mintData.minProjectTokenMinted, mintData.quoteAmount);
        await client!.mintProjectToken(params);

        setShow(true);
      } else if (inputSellValue) {
        const redeemData: RedeemData = abcUtils.getRedeemDataFromProjectToken(new BN(inputSellValue));
        const params = await client!.paramsBuilder.redeemProjectToken(project?.onChainData!, redeemData.projectTokenAmount, redeemData.minQuoteAmount);
        await client!.redeemProjectToken(params);

        setShow(true);
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    try {
      const getBalanceQuoteToken = async () => {
        if (project!.onChainData.abc) {
          client
            ?.getAssociatedTokenAmount(project!.onChainData.abc!.quoteTokenMint)
            .then((balance: BN) => {
              return balance.toNumber() / 1_000_000; // TODO: to make a variable lamports
            })
            .then(balance => {
              setBalanceQuoteToken(balance);
            })
            .catch(e => {
              setBalanceProjectToken(0); // account is not created yet
            });
        }
      };

      const getBalanceProjectToken = async () => {
        if (project) {
          client
            ?.getAssociatedTokenAmount(project!.onChainData.projectTokenMint)
            .then((balance: BN) => {
              return balance.toNumber() / 1_000_000; // TODO: to make a variable lamports
            })
            .then(balance => {
              setBalanceProjectToken(balance);
            })
            .catch(e => {
              setBalanceProjectToken(0); // account is not created yet
            });
        }
      };

      getBalanceQuoteToken().then(() => getBalanceProjectToken());
    } catch (e) {
      console.log(`error getting balances: `, e);
    }
  }, []);

  useEffect(() => {
    setInputBuyValue(inputSellValue);
    if (inputSellValue) {
      onSellInputChange(inputSellValue);
    }
  }, [buyProjectToken]);

  const onSellInputChange = (value: number | undefined) => {
    setInputSellValue(value);
    if (buyProjectToken) {
      const mintData: MintData = abcUtils.getMintDataFromQuote(new BN(value));
      setInputBuyValue(mintData.expectedProjectTokenMinted.toNumber());
      setMinimumBuyAmount(mintData.minProjectTokenMinted.toNumber());
    } else {
      const redeemData: RedeemData = abcUtils.getRedeemDataFromProjectToken(new BN(value));
      setInputBuyValue(redeemData.expectedQuoteAmount.toNumber());
      setMinimumBuyAmount(redeemData.minQuoteAmount.toNumber());
    }
  };
  const handleSellInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSellInputChange(event.target.valueAsNumber);
  };

  const handleBuyInputChange = (event: ChangeEvent<HTMLInputElement>) => {};
  const handleTopInputClick = () => {
    // setInputTopValue(0); // Clear the input field
  };

  const swapComp = (
    <>
      <div className="mt-3 d-flex flex-column gap-1 align-items-center position-relative">
        <div className="swapdiv w-100 px-3 py-3">
          <div className="d-flex justify-content-between ">
            <div>
              {/*{buyProjectToken ? <p className="text-white-50 helvetica">You Get</p> : <p className="text-white-50 helvetica">You Pay</p>}*/}
              <p className="text-white-50 helvetica">You Pay</p>
              <input
                type="number"
                value={inputSellValue}
                maxLength={12}
                onClick={handleTopInputClick}
                onChange={handleSellInputChange}
                className="bg-transparent border-0 h3 text-white nofocus"
                placeholder="0.0"
              />
              {/*TODO: add price back*/}
              {/*<p className="text-white-50 mb-0 helvetica">$1.63</p>*/}
            </div>

            <div>
              <div className="d-flex gap-3 align-items-center mb-4 pb-2">
                <img src={buyProjectToken ? quoteTokenLogo : project?.githubData.organization.avatar_url} alt="" className="brandimg" />
                <h1 className="helvetica text-white mb-0">{buyProjectToken ? quoteTokenCode : project?.tokenCode}</h1>
              </div>
              <p className="text-white text-end mb-0 helvetica fw-600">
                Balance: {buyProjectToken ? balanceQuoteToken : balanceProjectToken}{" "}
                <button
                  className="text__primary bg-transparent nofocus  border-0"
                  onClick={() => {
                    setInputSellValue(buyProjectToken ? balanceQuoteToken : balanceProjectToken);
                    onSellInputChange(buyProjectToken ? balanceQuoteToken : balanceProjectToken);
                  }}
                >
                  {" "}
                  Max
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="swapdiv w-100 px-3 py-3">
          <div className="d-flex justify-content-between">
            <div>
              <p className="text-white-50 helvetica">You Get</p>
              <input
                type="text"
                maxLength={10}
                value={inputBuyValue}
                className="bg-transparent border-0 h3 text-white nofocus"
                placeholder="0.0"
                onChange={handleBuyInputChange}
                disabled={true}
              />
              {/*TODO: add price back*/}
              {/*<p className="text-white-50 mb-0  helvetica">$1.63</p>*/}
            </div>
            <div>
              <div className="d-flex gap-3 align-items-center mb-4 pb-2">
                <img src={buyProjectToken ? project?.githubData.organization.avatar_url : quoteTokenLogo} alt="" className="brandimg" />
                <h1 className="helvetica text-white  mb-0">{buyProjectToken ? project?.tokenCode : quoteTokenCode}</h1>
              </div>
              <p className="text-white text-end mb-0 helvetica fw-600">Balance: {buyProjectToken ? balanceProjectToken : balanceQuoteToken}</p>
            </div>
          </div>
        </div>

        <button onClick={() => setBuyProjectToken(!buyProjectToken)} className="swapbtn bg-transparent border-0  nofocus">
          <img src={swapbtn} alt="" />
        </button>
      </div>
      <p className="text-center mt-3 ">
        <span className="text-center text-white-50 helvetica">
          Minimum received {minimumBuyAmount} {buyProjectToken ? project?.tokenCode : quoteTokenCode}
        </span>
      </p>

      {(inputSellValue || 0) <= ((buyProjectToken ? balanceQuoteToken : balanceProjectToken) || 0) ? (
        <button onClick={swap} className="connect__btn  w-100">
          Swap
        </button>
      ) : (
        <button disabled className="connect__btn bg-secondary border-0 w-100">
          Insufficient funds
        </button>
      )}
    </>
  );

  return (
    <>
      <div className="swapc">
        <div className="d-flex justify-content-between flex-lg-nowrap flex-wrap">
          <div className="d-flex gap-4 align-items-center">
            <Link to="/swap" className="text__primary text-decoration-none helvetica">
              Swap
            </Link>
            <Link to="/donate" className="text-white  text-decoration-none helvetica">
              Donate
            </Link>
          </div>
          <div>
            <p className="text-white helvetica mb-0">
              Your Holding &nbsp; - &nbsp;{" "}
              <span className="text__primary fw-bold">
                {buyProjectToken ? balanceQuoteToken : balanceProjectToken} {buyProjectToken ? quoteTokenCode : project?.tokenCode}
              </span>
            </p>
          </div>
        </div>

        {project?.onChainData.abc ? (
          swapComp
        ) : (
          <button disabled className="connect__btn bg-secondary border-0 w-100" style={{ marginTop: "50%" }}>
            ABC not initialized
          </button>
        )}
      </div>

      <Modal show={show} onHide={handleClose} centered id="registermodal" size="sm">
        {/* <Modal.Header closeButton>
                    <Modal.Title>Modal heading</Modal.Title>
                </Modal.Header> */}
        <Modal.Body>
          <div className="px-lg-1 py-3">
            <h5 className="text-white text-center">Donated Successfully</h5>
            <img src={kitty2} className="img-fluid mt-4 pt-3" alt="" />

            <div className="d-block mt-4 pt-3">
              <button onClick={handleClose} className="connect__btn w-100">
                Done
              </button>
            </div>
          </div>
        </Modal.Body>

        {/* <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleClose}>
                        Save Changes
                    </Button>
                </Modal.Footer> */}
      </Modal>
    </>
  );
};

export default SwapComp;
