import React, { useState } from 'react';
import '@fortawesome/fontawesome-free/css/all.css';
import './style.css';

const calculateIPDetails = (ip, mask) => {

    const maskToCidr = (mask) => {
        return mask.split('.')
            .map(octet => parseInt(octet, 10).toString(2))
            .join('')
            .split('1')
            .length - 1;
    };

    const getIPClass = (ip) => {
        const firstOctet = parseInt(ip.split('.')[0], 10);
        if (firstOctet >= 0 && firstOctet <= 126) return 'A';
        if (firstOctet === 127) return 'Endereço Loopback';
        if (firstOctet >= 128 && firstOctet <= 191) return 'B';
        if (firstOctet >= 192 && firstOctet <= 223) return 'C';
        if (firstOctet >= 224 && firstOctet <= 239) return 'D';
        if (firstOctet >= 240 && firstOctet <= 254) return 'E';
        if (firstOctet === 255) return 'Endereço de Broadcast';
        return 'Inválido';
    };

    const calculateSubnetsAndHosts = (cidr, ipClass) => {
        let subnetBits, numHosts;
        if (ipClass === 'A') {
            subnetBits = cidr - 8;
        } else if (ipClass === 'B') {
            subnetBits = cidr - 16;
        } else if (ipClass === 'C') {
            subnetBits = cidr - 24;
        } else {
            subnetBits = 0;
        }
        if (subnetBits < 0) subnetBits = 0;

        numHosts = Math.pow(2, 32 - cidr) - 2;

        return { numSubnets: Math.pow(2, subnetBits), numHosts };
    };

    const ipToRange = (ip, cidr) => {
        const ipParts = ip.split('.').map(Number);
        const mask = ~((1 << (32 - cidr)) - 1);
        const ipInt = ipParts.reduce((acc, part) => (acc << 8) + part);
        const network = ipInt & mask;
        const broadcast = network | ~mask;

        const toIPString = (int) => [
            (int >>> 24) & 255,
            (int >>> 16) & 255,
            (int >>> 8) & 255,
            int & 255
        ].join('.');

        return {
            firstIP: toIPString(network + 1),
            lastIP: toIPString(broadcast - 1),
            broadcastIP: toIPString(broadcast)
        };
    };

    const validateIP = (ip) => {
        const ipParts = ip.split('.');
        if (ipParts.length !== 4) return false;
        return ipParts.every(part => {
            const num = parseInt(part, 10);
            return num >= 0 && num <= 255;
        });
    };

    const validateMask = (mask) => {
        const maskParts = mask.split('.');
        if (maskParts.length !== 4) return false;
        const binaryMask = maskParts.map(part => parseInt(part, 10)
            .toString(2)
            .padStart(8, '0'))
            .join('');
        return /^1*0*$/.test(binaryMask);
    };

    if (!validateIP(ip) || !validateMask(mask)) {
        throw new Error("IP ou máscara inválidos.");
    }

    const cidr = maskToCidr(mask);
    const ipClass = getIPClass(ip);
    const { numSubnets, numHosts } = calculateSubnetsAndHosts(cidr, ipClass);
    const { firstIP, lastIP, broadcastIP } = ipToRange(ip, cidr);

    return {
        ip,
        ipClass,
        numSubnets,
        numHosts,
        newMask: mask,
        cidr,
        firstIP,
        lastIP,
        broadcastIP
    };
};

const Section = () => {
    const [calculationMode, setCalculationMode] = useState('cidr');
    const [inputData, setInputData] = useState({ ip: '', mask: '' });
    const [cidrData, setCidrData] = useState('');
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);

    const handleModeChange = (event) => {
        setCalculationMode(event.target.value);
    };

    const handleCaptureData = (event) => {
        setInputData({ ...inputData, [event.target.id]: event.target.value });
    };

    const handleCidrChange = (event) => {
        setCidrData(event.target.value);
    };

    const handleIpMaskSubmit = (event) => {
        event.preventDefault();
        try {
            const { ip, mask } = inputData;
            const result = calculateIPDetails(ip, mask);
            setResults([result]);
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCidrSubmit = (event) => {
        event.preventDefault();
        try {
            const [ip, cidr] = cidrData.split('/');
            if (cidr < 0 || cidr > 32) {
                throw new Error("CIDR inválido.");
            }
            const mask = Array(4).fill(0).map((_, i) => {
                if (cidr >= (i + 1) * 8) return 255;
                if (cidr > i * 8) return 256 - Math.pow(2, 8 - (cidr % 8));
                return 0;
            }).join('.');

            const result = calculateIPDetails(ip, mask);
            setResults([result]);
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <section className='section'>
            <div className='container'>
                <h2 className='title'>API Quantum Calculator</h2>

                <div className='option-buttons'>
                    <button onClick={() => {setResults([]);setError(null)}}>Limpar Resultados</button>
                </div>

                <div className='calculation-mode'>
                    <label>Escolha o modo de cálculo:</label>
                    <select value={calculationMode} onChange={handleModeChange}>
                        <option value='ipMask'>IP/Máscara</option>
                        <option value='cidr'>CIDR</option>
                    </select>
                </div>
                {calculationMode === 'ipMask' ? (
                    <form className='input-data-form' onSubmit={handleIpMaskSubmit}>
                        <h2 className='title-data'>IP/Máscara - Exemplo: 192.168.1.0/24</h2>
                        <input
                            className='input-data'
                            type='text'
                            id='ip'
                            placeholder='192.168.1.0'
                            value={inputData.ip}
                            onChange={handleCaptureData}
                        />
                        <input
                            className='input-data'
                            type='text'
                            id='mask'
                            placeholder='255.255.255.0'
                            value={inputData.mask}
                            onChange={handleCaptureData}
                        />
                        <button type='submit' className='button-calculator'>Calcular IP/Máscara</button>
                    </form>
                ) : (
                    <form className='input-data-form' onSubmit={handleCidrSubmit}>
                        <h2 className='title-data'>CIDR - Exemplo: 192.168.1.0/24</h2>
                        <input
                            className='input-data'
                            type='text'
                            id='cidr'
                            placeholder='192.168.1.0/24'
                            value={cidrData}
                            onChange={handleCidrChange}
                        />
                        <button type='submit' className='button-calculator'>Calcular CIDR</button>
                    </form>
                )}
                {error && (
                    <div className='error'>
                        <p>{error}</p>
                    </div>
                )}
                {results && results.length > 0 && (
                    <div className='results'>
                        {results.map((result, index) => (
                            <div key={index} className='result'>
                                {result.ipClass !== 'Inválido' && (
                                    <>
                                        <table>
                                            <tr>
                                                <th className='attribute'>IP</th>
                                                <th className='attribute'>Classe</th>
                                                <th className='attribute'>Número de subredes</th>
                                                <th className='attribute'>Número de host</th>
                                                <th className='attribute'>CIDR</th>
                                                <th className='attribute'>Primeiro endereço</th>
                                                <th className='attribute'>Último endereço</th>
                                                <th className='attribute'>Endereço de Broadcast</th>
                                            </tr>
                                            <tr>
                                                <td className='data-attribute'>{result.ip}</td>
                                                <td className='data-attribute'>{result.ipClass}</td>
                                                <td className='data-attribute'>{result.numSubnets}</td>
                                                <td className='data-attribute'>{result.numHosts}</td>
                                                <td className='data-attribute'>{result.cidr}</td>
                                                <td className='data-attribute'>{result.firstIP}</td>
                                                <td className='data-attribute'>{result.lastIP}</td>
                                                <td className='data-attribute'>{result.broadcastIP}</td>
                                            </tr>
                                        </table>
                                        
                                        <p>Máscara Decimal: {result.newMask}</p>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export { Section };