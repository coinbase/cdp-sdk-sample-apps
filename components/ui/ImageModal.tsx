import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './ImageModal.module.css';
import { MintResponse } from '@/app/api/mint/route';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tokenId: string;
  imageSrc: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  tokenId,
  imageSrc,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isMintSuccessful, setIsMintSuccessful] = useState(false);
  const [mintData, setMintData] = useState<MintResponse | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setImageLoaded(false);
    } else {
      setIsAnimating(false);
      setIsMinting(false);
      setIsMintSuccessful(false);
    }
  }, [isOpen]);

  const onMint = async () => {
    setIsMinting(true);
    try {
      console.log('Initiating minting process');
      const response = await fetch('/api/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ networkId: 'base-sepolia', tokenId: tokenId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MintResponse = await response.json();
      console.log('Mint response:', data);

      // Store the response data
      setMintData(data);

      setIsMintSuccessful(true);
    } catch (error) {
      console.error('Error during minting:', error);
      alert('Failed to mint. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  const onViewMintTransaction = () => {
    // Implement view transaction logic
    console.log('View transaction');
    if (mintData && mintData.mintTxUrl) {
      window.open(mintData.mintTxUrl, '_blank');
    } else {
      console.error('Mint transaction URL is not available');
    }
  };

  const onTransfer = () => {
    if (recipientAddress.trim() === '') {
      alert('Please enter a recipient address');
      return;
    }
    setIsTransferring(true);

    fetch('/api/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nftAddress: mintData?.contractAddress,
        toAddress: recipientAddress,
        tokenId: tokenId,
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Transfer response:', data);
        setTransferComplete(true);
      })
      .catch(error => {
        console.error('Error during transfer:', error);
        alert('Failed to transfer. Please try again.');
      })
      .finally(() => {
        setIsTransferring(false);
      });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!isMinting && !isTransferring) {
      onClose();
    }
    e.stopPropagation();
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <div
      className={`${styles.overlay} ${isOpen ? styles.overlayVisible : styles.overlayHidden} ${isMinting || isTransferring ? styles.overlayMinting : ''}`}
      onClick={handleOverlayClick}
    >
      <div
        className={`${styles.modal} ${isOpen ? styles.modalVisible : styles.modalHidden}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          key={isMinting ? 'minting' : isMintSuccessful ? (transferComplete ? 'transferred' : 'success') : 'initial'}
          className={`${styles.fullSize} w-full h-full blah`}
        >
          <h2 className={styles.title}>
            {isMinting ? "Minting..." : isMintSuccessful ? "Mint successful!" : title}
          </h2>
          <div className={styles.imageContainer}>
            <div className={`${styles.image} ${imageLoaded ? styles.imageLoaded : styles.imageLoading}`}>
              <Image
                src={imageSrc}
                alt="Modal image"
                width={300}
                height={300}
                objectFit="contain"
                className="rounded-lg shadow-md"
                onLoadingComplete={() => setImageLoaded(true)}
              />
              {isMinting && (
                <div className={styles.loadingOverlay}>
                  <div className={styles.spinner}></div>
                </div>
              )}
            </div>
          </div>
          {!isMinting && !isMintSuccessful && (
            <div className={styles.buttonContainer}>
              <div className={`${styles.buttonContainer} ${styles.buttonContainerWithTwoButtons}`}>
                <button
                  onClick={onMint}
                  className={`${styles.button} bg-blue-500 hover:bg-blue-600`}
                >
                  Mint it!
                </button>
                <button
                  onClick={onClose}
                  className={`${styles.button} bg-gray-500 hover:bg-gray-600`}
                >
                  Re-prompt
                </button>
              </div>
            </div>
          )}
          {isMintSuccessful && !transferComplete && (
            <div className={styles.transferContainer}>
              <button
                onClick={onViewMintTransaction}
                className={`${styles.button} bg-blue-500 hover:bg-blue-600`}
              >
                View mint transaction
              </button>
              <div className={styles.divider}></div>
              <input
                type="text"
                placeholder="Enter recipient address"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className={`${styles.input} mt-2 mb-4`}
                disabled={isTransferring}
              />
              <button
                onClick={onTransfer}
                disabled={isTransferring}
                className={`${styles.button} bg-green-500 hover:bg-green-600 relative`}
              >
                {isTransferring ? (
                  <>
                    <span className="opacity-0">Transfer</span>
                    <div className={`${styles.loadingOverlay} rounded-full`}>
                      <div className={styles.spinner}></div>
                    </div>
                  </>
                ) : (
                  'Transfer'
                )}
              </button>
            </div>
          )}
          {transferComplete && (
            <div className={styles.transferComplete}>
              Transferred to{' '}
              <span className={styles.recipientAddress}>
                {recipientAddress}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
