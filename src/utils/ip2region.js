/**
 * ip2region client for nodejs
 *
 * project: https://github.com/lionsoul2014/ip2region
 *
 * @author dongyado<dongyado@gmail.com>
 * @author leeching<leeching.fx@gmail.com>
 * @author dongwei<maledong_github@outlook.com>
 */
const fs = require("fs");
const path = require("path");
const DEFAULT_DB_PATH = path.join(__dirname, "ip2region.db");

//#region Private Functions
/**
 * Convert ip to long (xxx.xxx.xxx.xxx to a integer)
 *
 * @param {string} ip
 * @return {number} long value
 */
function _ip2long(ip) {
  const arr = ip.split(".");
  if (arr.length !== 4) {
    throw new Error("invalid ip");
  }
  return arr.reduce((val, n, i) => {
    n = Number(n);
    if (!Number.isInteger(n) || n < 0 || n > 255) {
      throw new Error("invalid ip");
    }
    return val + IP_BASE[i] * n;
  }, 0);
}

/**
 * Get long value from buffer with specified offset
 *
 * @param {Buffer} buffer
 * @param {number} offset
 * @return {number} long value
 */
function _getLong(buffer, offset) {
  const val =
    (buffer[offset] & 0x000000ff) |
    ((buffer[offset + 1] << 8) & 0x0000ff00) |
    ((buffer[offset + 2] << 16) & 0x00ff0000) |
    ((buffer[offset + 3] << 24) & 0xff000000);
  return val < 0 ? val >>> 0 : val;
}

//#endregion

//#region Private Variables

// We don't wanna expose a private global settings to
// the public for safety reason.
const _globalInstances = new Map();

const IP_BASE = [16777216, 65536, 256, 1];
const INDEX_BLOCK_LENGTH = 12;
const TOTAL_HEADER_LENGTH = 8192;

// Private Message Symbols for functions
const PrepareHeader = Symbol("#PrepareHeader");
const CalTotalBlocks = Symbol("#CalsTotalBlocks");
const ReadDataSync = Symbol("#ReadDataSync");
const ReadData = Symbol("#ReadData");

//#endregion
class IP2Region {
  //#region Private Functions

  [CalTotalBlocks]() {
    const superBlock = Buffer.alloc(8);
    fs.readSync(this.dbFd, superBlock, 0, 8, 0);
    this.firstIndexPtr = _getLong(superBlock, 0);
    this.lastIndexPtr = _getLong(superBlock, 4);
    this.totalBlocks =
      (this.lastIndexPtr - this.firstIndexPtr) / INDEX_BLOCK_LENGTH + 1;
  }

  [PrepareHeader]() {
    fs.readSync(this.dbFd, this.headerIndexBuffer, 0, TOTAL_HEADER_LENGTH, 8);

    for (let i = 0; i < TOTAL_HEADER_LENGTH; i += 8) {
      const startIp = _getLong(this.headerIndexBuffer, i);
      const dataPtr = _getLong(this.headerIndexBuffer, i + 4);
      if (dataPtr === 0) break;

      this.headerSip.push(startIp);
      this.headerPtr.push(dataPtr);
      this.headerLen++; // header index size count
    }
  }

  [ReadData](dataPos, callBack) {
    if (dataPos === 0) return callBack(null, null);
    const dataLen = (dataPos >> 24) & 0xff;
    dataPos = dataPos & 0x00ffffff;
    const dataBuffer = Buffer.alloc(dataLen);

    fs.read(this.dbFd, dataBuffer, 0, dataLen, dataPos, (err, result) => {
      if (err) {
        callBack(err, null);
      } else {
        const city = _getLong(dataBuffer, 0);
        const region = dataBuffer.toString("utf8", 4, dataLen);
        callBack(null, { city, region });
      }
    });
  }

  [ReadDataSync](dataPos) {
    if (dataPos === 0) return null;
    const dataLen = (dataPos >> 24) & 0xff;
    dataPos = dataPos & 0x00ffffff;
    const dataBuffer = Buffer.alloc(dataLen);

    fs.readSync(this.dbFd, dataBuffer, 0, dataLen, dataPos);

    const city = _getLong(dataBuffer, 0);
    const region = dataBuffer.toString("utf8", 4, dataLen);

    return { city, region };
  }
  //#endregion

  //#region Static Functions

  // Single Instance
  static create(dbPath = DEFAULT_DB_PATH) {
    let existInstance = _globalInstances.get(dbPath);
    if (existInstance == null) {
      existInstance = new IP2Region({ dbPath: dbPath });
    }
    return existInstance;
  }

  /**
   * For backward compatibility
   */
  static destroy() {
    _globalInstances.forEach(([key, instance]) => {
      instance.destroy();
    });
  }

  //#endregion

  constructor(options = {}) {
    const { dbPath } = options;

    // Keep for MemorySearch
    this.totalInMemoryBytesSize = fs.statSync(dbPath).size;
    this.totalInMemoryBytes = null;

    this.dbFd = fs.openSync(dbPath, "r");

    this.dbPath = dbPath;

    _globalInstances.set(this.dbPath, this);

    this.totalBlocks = this.firstIndexPtr = this.lastIndexPtr = 0;
    this[CalTotalBlocks]();

    this.headerIndexBuffer = Buffer.alloc(TOTAL_HEADER_LENGTH);
    this.headerSip = [];
    this.headerPtr = [];
    this.headerLen = 0;
    this[PrepareHeader]();
  }

  //#region Public Functions
  /**
   * Destroy the current file by closing it.
   */
  destroy() {
    fs.closeSync(this.dbFd);
    _globalInstances.delete(this.dbPath);
  }

  /**
   * Async of btreeSearch.
   * @param {string} ip The IP address to search for.
   * @param {Function} callBack The callBack function with two parameters, if successful,
   * err is null and result is `{ city: 2163, region: '中国|0|广东省|深圳市|阿里云' }`
   */
  btreeSearch(ip, callBack) {
    ip = _ip2long(ip);

    // first search  (in header index)
    let low = 0;
    let mid = 0;
    let high = this.headerLen;
    let sptr = 0;
    let eptr = 0;

    while (low <= high) {
      mid = (low + high) >> 1;

      if (ip === this.headerSip[mid]) {
        if (mid > 0) {
          sptr = this.headerPtr[mid - 1];
          eptr = this.headerPtr[mid];
        } else {
          sptr = this.headerPtr[mid];
          eptr = this.headerPtr[mid + 1];
        }
        break;
      }

      if (ip < this.headerSip[mid]) {
        if (mid === 0) {
          sptr = this.headerPtr[mid];
          eptr = this.headerPtr[mid + 1];
          break;
        } else if (ip > this.headerSip[mid - 1]) {
          sptr = this.headerPtr[mid - 1];
          eptr = this.headerPtr[mid];
          break;
        }
        high = mid - 1;
      } else {
        if (mid === this.headerLen - 1) {
          sptr = this.headerPtr[mid - 1];
          eptr = this.headerPtr[mid];
          break;
        } else if (ip <= this.headerSip[mid + 1]) {
          sptr = this.headerPtr[mid];
          eptr = this.headerPtr[mid + 1];
          break;
        }
        low = mid + 1;
      }
    }

    // match nothing
    if (sptr === 0) return callBack(null, null);

    let p = 0;
    let sip = 0;

    // second search (in index)
    const blockLen = eptr - sptr;
    const blockBuffer = Buffer.alloc(blockLen + INDEX_BLOCK_LENGTH);
    low = 0;
    high = blockLen / INDEX_BLOCK_LENGTH;

    const _self = this;

    function _innerAsyncWhile() {
      if (low <= high) {
        mid = (low + high) >> 1;
        p = mid * INDEX_BLOCK_LENGTH;

        // Use this to call the method itself as
        // an asynchronize step
        fs.read(
          _self.dbFd,
          blockBuffer,
          0,
          blockLen + INDEX_BLOCK_LENGTH,
          sptr,
          err => {
            if (err) {
              return callBack(err, null);
            }

            sip = _getLong(blockBuffer, p);

            if (ip < sip) {
              high = mid - 1;
              setImmediate(_innerAsyncWhile);
            } else {
              sip = _getLong(blockBuffer, p + 4);
              if (ip > sip) {
                low = mid + 1;
                setImmediate(_innerAsyncWhile);
              } else {
                sip = _getLong(blockBuffer, p + 8);
                _self[ReadData](sip, (err, result) => {
                  callBack(err, result);
                });
              }
            }
          }
        );
      } else {
        // If we found nothing, return null
        return callBack(null, null);
      }
    }

    _innerAsyncWhile();
  }
}
//#endregion

export default IP2Region;
