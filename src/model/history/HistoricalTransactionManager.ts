import type { IdHelper } from '@/model/misc/tools';
import { NonReactive } from '@/model/type-defs/decorators';
import type { HistoricalIncidentReport, HistoricalProtocolOptions, History } from '@/model/history';

export interface ExecTransactionOptions {
  propagate?: boolean;
  signOnClose?: boolean;
}

const defaultOptions = { propagate: true, signOnClose: true };

@NonReactive
export class HistoricalTransactionManager {
  private readonly idHelper: IdHelper;
  private readonly history: History;
  private protocolOptions: HistoricalProtocolOptions | undefined;
  private level: number = 0;

  public constructor(idHelper: IdHelper, history: History) {
    this.idHelper = idHelper;
    this.history = history;
  }

  public transact(report: HistoricalIncidentReport, options: ExecTransactionOptions = defaultOptions) {
    const effectiveOptions = { ...defaultOptions, ...options };
    this.openTransaction(report.protocolOptions, effectiveOptions);
    this.exeucteInTransaction(report);
    this.tryCloseTransaction(effectiveOptions);
  }

  public openTransaction(protocolOptions: HistoricalProtocolOptions | undefined = undefined, options: ExecTransactionOptions = defaultOptions) {
    if (!options.propagate && this.level > 0) {
      throw new Error(`IllegalState: try open transaction ${protocolOptions} with 
        no propagate enabled, when transaction ${this.protocolOptions} still opened`);
    }

    if (this.level === 0) {
      this.protocolOptions = protocolOptions !== undefined
        ? protocolOptions
        : { protocolTitle: this.getNewTransactionId() };
    }

    this.level++;
  }

  public exeucteInTransaction(report: Omit<HistoricalIncidentReport, 'protocolOptions'>) {
    this.checkWeAreInTransaction();

    if (!this.protocolOptions) {
      throw new Error('Oops');
    }

    this.history.reportProcessor({ ...report, protocolOptions: this.protocolOptions });
  }

  public tryCloseTransaction(options: { signOnClose: boolean } = { signOnClose: true }): boolean {
    if (this.level <= 0) {
      throw new Error(`IllegalState: Try close already closed transaction ${this.protocolOptions}`);
    }

    if (this.level === 1 && options.signOnClose) {
      this.exeucteInTransaction({
        sign: true,
      });
    }

    this.level--;

    return this.level === 0;
  }

  private getNewTransactionId(): string {
    return this.idHelper.getNewId('historical-transaction-');
  }

  private checkWeAreInTransaction(): void {
    if (!this.level) {
      throw new Error('Invalid state, HistoricalTransactionsManager.openTransaction() should be used before');
    }
  }
}
