import React, { useState } from 'react';
import '@fortawesome/fontawesome-free/css/all.css';
import './style.css';

const calculateIPDetails = (ip, mask) => {
    const ipMaskToBinary = (ip) => {
        return ip.split('.').map(octet => parseInt(octet, 10).toString(2).padStart(8, '0')).join('.');
    };

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
        let subnetBits = cidr - (ipClass === 'A' ? 8 : ipClass === 'B' ? 16 : ipClass === 'C' ? 24 : 0);
        if (subnetBits < 0) subnetBits = 0;

        const numSubnets = Math.pow(2, subnetBits);
        const numHosts = Math.pow(2, 32 - cidr) - 2;

        return { numSubnets, numHosts };
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

    const generateSubnets = (ip, cidr) => {
        const numSubnets = Math.pow(2, cidr % 8);
        const numHosts = Math.pow(2, 32 - cidr) - 2;
        const subnetSize = numHosts + 2; // Including network and broadcast addresses

        const ipInt = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);

        const subnets = [];
        for (let i = 0; i < numSubnets; i++) {
            const subnetInt = ipInt + (i * subnetSize);
            const network = [
                ((subnetInt - 1) >>> 24) & 255,
                ((subnetInt - 1) >>> 16) & 255,
                ((subnetInt - 1) >>> 8) & 255,
                (subnetInt - 1) & 255,
            ].join('.');
            const firstHost = [
                ((subnetInt) >>> 24) & 255,
                ((subnetInt) >>> 16) & 255,
                ((subnetInt) >>> 8) & 255,
                (subnetInt) & 255,
            ].join('.');
            const lastHost = [
                ((subnetInt + numHosts - 1) >>> 24) & 255,
                ((subnetInt + numHosts - 1) >>> 16) & 255,
                ((subnetInt + numHosts - 1) >>> 8) & 255,
                (subnetInt + numHosts - 1) & 255,
            ].join('.');
            const broadcast = [
                ((subnetInt + subnetSize - 2) >>> 24) & 255,
                ((subnetInt + subnetSize - 2) >>> 16) & 255,
                ((subnetInt + subnetSize - 2) >>> 8) & 255,
                (subnetInt + subnetSize - 2) & 255,
            ].join('.');

            subnets.push({
                subnet: i + 1,
                network,
                range: `${firstHost} - ${lastHost}`,
                broadcast,
            });
        }
        return subnets;
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
        alert("IP ou máscara inválidos.");
        return null;
    }

    const cidr = maskToCidr(mask);
    const binaryIp = ipMaskToBinary(ip);
    const ipClass = getIPClass(ip);
    const binaryMask = ipMaskToBinary(mask);
    const { numSubnets, numHosts } = calculateSubnetsAndHosts(cidr, ipClass);
    const { firstIP, lastIP, broadcastIP } = ipToRange(ip, cidr);
    const binaryFirstIp = ipMaskToBinary(firstIP);
    const binaryLastIp = ipMaskToBinary(lastIP);
    const binaryBroadcastIp = ipMaskToBinary(broadcastIP);
    const subnets = generateSubnets(ip, cidr);

    return {
        ip,
        binaryIp,
        ipClass,
        numSubnets,
        numHosts,
        mask,
        binaryMask,
        cidr,
        firstIP,
        lastIP,
        broadcastIP,
        binaryFirstIp,
        binaryLastIp,
        binaryBroadcastIp,
        subnets
    };
};

const Section = () => {
    const [calculationMode, setCalculationMode] = useState('ipMask');
    const [inputData, setInputData] = useState({ ip: '', mask: '' });
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);

    const handleModeChange = (event) => {
        setCalculationMode(event.target.value);
        setInputData({ ip: '', mask: '', cidr: '' });
        setResults([]);
        setError(null);
    };

    const handleCaptureData = (event) => {
        setInputData({ ...inputData, [event.target.id]: event.target.value });
    };

    const handleMaskChange = (event) => {
        const mask = event.target.value;
        setInputData({ ...inputData, mask });
    };

    const handleIpMaskSubmit = (event) => {
        event.preventDefault();
        try {
            const { ip, mask } = inputData;
        if (!validateIP(ip)) {
            setError("Campos de IP ou CIDR vazios ou inválidos. Certifique-se de que o IP e Máscara são válido.");
            setResults([]);
            return;

        }
        if (!/^\d+(\.\d+){3}$/.test(ip)) {
            setResults([]);
            setError("IP ou Máscara vazios ou inválidos. Certifique-se de que o IP é válido e que o CIDR está entre 8 e 30.");
            return false;

        }
        if (ip.startsWith("127")) {
            setError("ERROR: Endereço de loopback. Este endereço é um endereço reservado.");
            setResults([]);
            return false;
        }
        const broadcastAddress = getBroadcastAddress(ip, mask);

        if (broadcastAddress === ip) {
            setError("ERROR: Endereço de broadcast. Este endereço é um endereço reservado.");
            setResults([]);
            return false;
        }
        if (mask === '') {
            setError("Selecione uma máscara.");
            setResults([]);
            return;
        }

        const result = calculateIPDetails(ip, mask);
        setResults([result]);
        setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const getBroadcastAddress = (ip, mask) => {
        const ipParts = ip.split('.').map(Number);
        const maskParts = mask.split('.').map(Number);
        const broadcastParts = ipParts.map((part, i) => part | ~maskParts[i] & 255);
        return broadcastParts.join('.');
    };
    
    const handleCidrSubmit = (event) => {
        event.preventDefault();
        try {
            const [ip, cidr] = inputData.cidr.split('/');
            if (!validateIP(ip) || cidr < 8 || cidr > 30 || isNaN(cidr)) {
                setError("IP ou CIDR inválidos. Certifique-se de que o IP é válido e que o CIDR está entre 8 e 30.");
                setResults([]);
                return;
            }
            const mask = Array(4).fill(0).map((_, i) => {
                if (cidr >= (i + 1) * 8) return 255;
                if (cidr > i * 8) return 256 - Math.pow(2, 8 - (cidr % 8));
                return 0;
            }).join('.');

            const broadcastAddress = getBroadcastAddress(ip, mask);
            if (broadcastAddress === ip) {
                setError("ERROR: Endereço de broadcast. Este endereço é um endereço reservado.");
                setResults([]);
                return false;
            }
            const result = calculateIPDetails(ip, mask);
            setResults([result]);
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const validateIP = (ip) => {
        const ipParts = ip.split('.');
        if (ipParts.length !== 4) return false;
        if (ipParts.every(part => part === '0')) return false;
        if (ipParts.some(part => part === '255')) return true;
        if (ipParts[0] === '127') return false;
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

    const cidrToMask = (cidr) => {
        return Array(4).fill(0).map((_, i) => {
            const bits = Math.min(8, Math.max(0, cidr - i * 8));
            return 256 - Math.pow(2, 8 - bits);
        }).join('.');
    };

    return (
        <section className='section'>
            <div className='container'>
                <h2 className='title'>API Calculator</h2>

                <div className='option-buttons'>
                    <button onClick={() => { setResults([]); setError(null); }}>Limpar Resultados</button>
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
                        <h2 className='title-data'>IP/Máscara - Exemplo: 192.168.1.0</h2>
                        <input
                            className='input-data'
                            type='text'
                            id='ip'
                            placeholder='192.168.1.0'
                            value={inputData.ip}
                            onChange={handleCaptureData}
                        />
                        <select value={inputData.mask} onChange={handleMaskChange}>
                            <option value=''>Selecione a máscara.</option>
                            <option value='255.0.0.0'>255.0.0.0/8</option>
                            <option value='255.128.0.0'>255.128.0.0/9</option>
                            <option value='255.192.0.0'>255.192.0.0/10</option>
                            <option value='255.224.0.0'>255.224.0.0/11</option>
                            <option value='255.240.0.0'>255.240.0.0/12</option>
                            <option value='255.248.0.0'>255.248.0.0/13</option>
                            <option value='255.252.0.0'>255.252.0.0/14</option>
                            <option value='255.254.0.0'>255.254.0.0/15</option>
                            <option value='255.255.0.0'>255.255.0.0/16</option>
                            <option value='255.255.128.0'>255.255.128.0/17</option>
                            <option value='255.255.192.0'>255.255.192.0/18</option>
                            <option value='255.255.224.0'>255.255.224.0/19</option>
                            <option value='255.255.240.0'>255.255.240.0/20</option>
                            <option value='255.255.248.0'>255.255.248.0/21</option>
                            <option value='255.255.252.0'>255.255.252.0/22</option>
                            <option value='255.255.254.0'>255.255.254.0/23</option>
                            <option value='255.255.255.0'>255.255.255.0/24</option>
                            <option value='255.255.255.128'>255.255.255.128/25</option>
                            <option value='255.255.255.192'>255.255.255.192/26</option>
                            <option value='255.255.255.224'>255.255.255.224/27</option>
                            <option value='255.255.255.240'>255.255.255.240/28</option>
                            <option value='255.255.255.248'>255.255.255.248/29</option>
                            <option value='255.255.255.252'>255.255.255.252/30</option>
                        </select>
                        <button type='submit' className='button-calculator'>Calcular IP</button>
                    </form>
                ) : (
                    <form className='input-data-form' onSubmit={handleCidrSubmit}>
                        <h2 className='title-data'>CIDR - Exemplo: 192.168.1.0/24</h2>
                        <input
                            className='input-data'
                            type='text'
                            id='cidr'
                            placeholder='192.168.1.0/24'
                            value={inputData.cidr}
                            onChange={handleCaptureData}
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
                                {result.ipClass !== 'Invalid' && (
                                    <>
                                        <div className='card'>
                                            <h3 className='text-view'>Protocolo de Internet - IP</h3>
                                            <h4 className='text-information'>{result.ip}</h4>
                                            <h4 className='text-information'>{result.binaryIp}</h4>

                                            <h3 className='text-view'>Máscara</h3>
                                            <h4 className='text-information'><p>Máscara Decimal: {result.mask}</p></h4>
                                            <h4 className='text-information'><p>Máscara Binário: {result.binaryMask}</p></h4>

                                            <h3 className='text-view'>Classe</h3>
                                            <h4 className='text-information'>{result.ipClass}</h4>

                                            <h3 className='text-view'>Número de subredes</h3>
                                            <h4 className='text-information'>{result.numSubnets}</h4>

                                            <h3 className='text-view'>Número de hosts</h3>
                                            <h4 className='text-information'>{result.numHosts}</h4>

                                            <h3 className='text-view'>CIDR</h3>
                                            <h4 className='text-information'>{result.cidr}</h4>

                                            <h3 className='text-view'>Primeiro endereço</h3>
                                            <h4 className='text-information'>{result.firstIP}</h4>
                                            <h4 className='text-information'>{result.binaryFirstIp}</h4>

                                            <h3 className='text-view'>Último endereço</h3>
                                            <h4 className='text-information'>{result.lastIP}</h4>
                                            <h4 className='text-information'>{result.binaryLastIp}</h4>

                                            <h3 className='text-view'>Endereço de Broadcast</h3>
                                            <h4 className='text-information'>{result.broadcastIP}</h4>
                                            <h4 className='text-information'>{result.binaryBroadcastIp}</h4>
                                        </div>

                                        <div>
                                            <h2 className='text-view-table'>Detalhes da sub-rede</h2>
                                            <table className='table-view'>
                                                <thead className='thead'>
                                                    <tr className='thead-view'>
                                                    <th className='thead-view'>Subrede</th>
                                                    <th className='thead-view'>Endereço de rede</th>
                                                    <th className='thead-view'>Intervalo de subredes utilizaveis</th>
                                                    <th className='thead-view'>Endereço de broadcast</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {result.subnets.map((subnet, i) => (
                                                        <tr key={i}>
                                                            <td>{subnet.subnet}</td>
                                                            <td>{subnet.network}</td>
                                                            <td>{subnet.range}</td>
                                                            <td>{subnet.broadcast}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
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

export {Section};
